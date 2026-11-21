-- Exercises as whole tasks (#350): an Exercise is its statement with any
-- shared stem, all its subtasks and every solution chunk, wherever they are
-- printed. A grouping call in the build decides which exercise and solution
-- chunks form each Exercise; the parse no longer pairs.

-- The chunks of an Exercise ------------------------------------------------

create table public.exercise_chunks (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  -- A chunk belongs to at most one Exercise.
  chunk_id uuid not null unique references public.chunks (id) on delete cascade,
  role text not null check (role in ('question', 'solution')),
  -- 0-based order among the Exercise's chunks of the same role.
  position integer not null check (position >= 0),
  owner uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  primary key (exercise_id, chunk_id)
);

comment on table public.exercise_chunks is 'A question or solution chunk of an Exercise, in order. The first question chunk is exercises.question_chunk_id.';

create index exercise_chunks_owner_idx on public.exercise_chunks (owner);
create index exercise_chunks_course_id_idx on public.exercise_chunks (course_id);

alter table public.exercise_chunks enable row level security;

create policy "Students can read their own exercise chunks"
on public.exercise_chunks for select to authenticated
using ((select auth.uid()) = owner);

revoke all on table public.exercise_chunks from anon, authenticated;
grant select on table public.exercise_chunks to authenticated;

-- The Exercises stored so far keep their question and solution chunk.
insert into public.exercise_chunks (exercise_id, chunk_id, role, position, owner, course_id)
select id, question_chunk_id, 'question', 0, owner, course_id
from public.exercises
on conflict do nothing;

insert into public.exercise_chunks (exercise_id, chunk_id, role, position, owner, course_id)
select id, solution_chunk_id, 'solution', 0, owner, course_id
from public.exercises
where solution_chunk_id is not null
on conflict do nothing;

alter table public.exercises drop column solution_chunk_id;

-- The pairing goes ---------------------------------------------------------

drop function public.replace_exercise_solutions(uuid, bigint, jsonb);
drop function public.request_exercise_pairing(uuid);
drop table public.exercise_solutions;
alter table public.courses drop column pairing_requested;

-- The grouping's result ----------------------------------------------------

alter table public.knowledge_map_builds
  add column exercise_groups jsonb
    check (exercise_groups is null or jsonb_typeof(exercise_groups) = 'object'),
  add column exercise_grouping_hash text
    check (exercise_grouping_hash is null or char_length(exercise_grouping_hash) = 64);

comment on column public.knowledge_map_builds.exercise_groups is 'The Course''s Exercises as the grouping step left them: { exercises: [{ questionChunkIds, solutionChunkIds }], fallback }, in Course order. fallback is true when a grouping call failed and its exercise chunks became Exercises of their own.';
comment on column public.knowledge_map_builds.exercise_grouping_hash is 'SHA-256 of the Course''s exercise and solution chunk ids the grouping was made from; null when it fell back, so the next build groups again.';

-- Exercise units were per Chapter; Exercise batches replace them, and every
-- map needs Update map.
delete from public.chapter_extractions where kind = 'exercise';
update public.knowledge_map_builds set needs_update = true;

-- Storing Exercises ----------------------------------------------------------

-- As before (20261101110000), except for an exercise batch's entry: its
-- `chunkIds` are the question chunks of its Exercises, and each Exercise
-- is { questionChunkId, questionChunkIds, solutionChunkIds, kcIds,
-- finalAnswers, difficulty }. An Exercise is stored by its first question
-- chunk, keeping its id; an Exercise stored by another of the batch's
-- chunks goes. Each listed Exercise's chunks replace its earlier ones, and
-- a chunk another Exercise held moves to it.
create or replace function public.store_chapter_kcs(
  p_course_id uuid,
  p_kcs jsonb,
  p_prerequisites jsonb,
  p_units jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_position integer;
begin
  select owner into v_owner
  from public.knowledge_map_builds
  where course_id = p_course_id and status = 'building'
  for update;
  if not found then
    return false;
  end if;

  delete from public.kc_sources as s
  using jsonb_array_elements(p_units) as u (value)
  cross join jsonb_array_elements_text(u.value -> 'chunkIds') as c (chunk_id)
  where u.value ? 'exercises'
    and s.course_id = p_course_id
    and s.chunk_id = c.chunk_id::uuid;

  select coalesce(max(position) + 1, 0) into v_position
  from public.kcs
  where course_id = p_course_id;

  insert into public.kcs (
    id, owner, course_id, name, description, origin, position, embedding
  )
  select
    (k.value ->> 'id')::uuid, v_owner, p_course_id,
    k.value ->> 'name', k.value ->> 'description',
    coalesce(k.value ->> 'origin', 'content'),
    v_position + (row_number() over (order by k.ord)) - 1,
    (k.value ->> 'embedding')::extensions.vector
  from jsonb_array_elements(p_kcs) with ordinality as k (value, ord)
  where (k.value ->> 'new')::boolean;

  update public.kcs as k
  set retired_at = null
  from jsonb_array_elements(p_kcs) as r (value)
  where not (r.value ->> 'new')::boolean
    and k.id = (r.value ->> 'id')::uuid
    and k.course_id = p_course_id
    and k.retired_at is not null;

  insert into public.kc_sources (kc_id, chunk_id, owner, course_id)
  select distinct kc.id, c.id, v_owner, p_course_id
  from jsonb_array_elements(p_kcs) as k (value)
  cross join jsonb_array_elements_text(k.value -> 'sources') as s (chunk_id)
  join public.kcs as kc
    on kc.id = (k.value ->> 'id')::uuid and kc.course_id = p_course_id
  join public.chunks as c
    on c.id = s.chunk_id::uuid and c.course_id = p_course_id
  on conflict (kc_id, chunk_id) do nothing;

  insert into public.prerequisite_links (owner, course_id, from_kc, to_kc)
  select v_owner, p_course_id, f.id, t.id
  from jsonb_array_elements(p_prerequisites) as l (value)
  join public.kcs as f
    on f.id = (l.value ->> 'from')::uuid and f.course_id = p_course_id
  join public.kcs as t
    on t.id = (l.value ->> 'to')::uuid and t.course_id = p_course_id
  where f.id <> t.id
  on conflict (from_kc, to_kc) do nothing;

  -- Exercises ------------------------------------------------------------------

  delete from public.exercises as e
  using jsonb_array_elements(p_units) as u (value)
  cross join jsonb_array_elements_text(u.value -> 'chunkIds') as c (chunk_id)
  where u.value ? 'exercises'
    and e.course_id = p_course_id
    and e.question_chunk_id = c.chunk_id::uuid
    and not exists (
      select 1 from jsonb_array_elements(u.value -> 'exercises') as x (value)
      where (x.value ->> 'questionChunkId')::uuid = e.question_chunk_id
    );

  select coalesce(max(position) + 1, 0) into v_position
  from public.exercises
  where course_id = p_course_id;

  insert into public.exercises (
    owner, course_id, question_chunk_id, difficulty, final_answers, position
  )
  select
    v_owner, p_course_id, q.id, (x.value ->> 'difficulty')::smallint,
    case
      when jsonb_array_length(coalesce(x.value -> 'finalAnswers', '[]')) > 0
        then x.value -> 'finalAnswers'
    end,
    v_position + (row_number() over (order by u.ord, x.ord)) - 1
  from jsonb_array_elements(p_units) with ordinality as u (value, ord)
  cross join jsonb_array_elements(u.value -> 'exercises') with ordinality as x (value, ord)
  join public.chunks as q
    on q.id = (x.value ->> 'questionChunkId')::uuid and q.course_id = p_course_id
  where u.value ? 'exercises'
  on conflict (question_chunk_id) do update
  set difficulty = excluded.difficulty,
    final_answers = excluded.final_answers;

  -- The listed Exercises' chunks replace what they and their chunks held.
  delete from public.exercise_chunks as ec
  using public.exercises as e,
    jsonb_array_elements(p_units) as u (value)
  cross join jsonb_array_elements(u.value -> 'exercises') as x (value)
  where u.value ? 'exercises'
    and e.course_id = p_course_id
    and e.question_chunk_id = (x.value ->> 'questionChunkId')::uuid
    and ec.course_id = p_course_id
    and (
      ec.exercise_id = e.id
      or ec.chunk_id::text in (
        select jsonb_array_elements_text(x.value -> 'questionChunkIds')
        union all
        select jsonb_array_elements_text(x.value -> 'solutionChunkIds')
      )
    );

  insert into public.exercise_chunks (
    exercise_id, chunk_id, role, position, owner, course_id
  )
  select e.id, c.id, m.role, (m.ord - 1)::integer, v_owner, p_course_id
  from jsonb_array_elements(p_units) as u (value)
  cross join jsonb_array_elements(u.value -> 'exercises') as x (value)
  join public.exercises as e
    on e.question_chunk_id = (x.value ->> 'questionChunkId')::uuid
    and e.course_id = p_course_id
  cross join lateral (
    select q.chunk_id, 'question' as role, q.ord
    from jsonb_array_elements_text(x.value -> 'questionChunkIds') with ordinality as q (chunk_id, ord)
    union all
    select s.chunk_id, 'solution', s.ord
    from jsonb_array_elements_text(x.value -> 'solutionChunkIds') with ordinality as s (chunk_id, ord)
  ) as m
  join public.chunks as c on c.id = m.chunk_id::uuid and c.course_id = p_course_id
  where u.value ? 'exercises'
  on conflict (chunk_id) do nothing;

  delete from public.exercise_kcs as ek
  using public.exercises as e,
    jsonb_array_elements(p_units) as u (value)
  cross join jsonb_array_elements(u.value -> 'exercises') as x (value)
  where u.value ? 'exercises'
    and e.course_id = p_course_id
    and e.question_chunk_id = (x.value ->> 'questionChunkId')::uuid
    and ek.exercise_id = e.id;

  insert into public.exercise_kcs (exercise_id, kc_id, owner, course_id)
  select distinct e.id, k.id, v_owner, p_course_id
  from jsonb_array_elements(p_units) as u (value)
  cross join jsonb_array_elements(u.value -> 'exercises') as x (value)
  cross join jsonb_array_elements_text(x.value -> 'kcIds') as i (kc_id)
  join public.exercises as e
    on e.question_chunk_id = (x.value ->> 'questionChunkId')::uuid
    and e.course_id = p_course_id
  join public.kcs as k
    on k.id = i.kc_id::uuid and k.course_id = p_course_id
  where u.value ? 'exercises';

  update public.chapter_extractions as e
  set
    kc_ids = array(
      select x.id::uuid
      from jsonb_array_elements_text(u.value -> 'kcIds') with ordinality as x (id, ord)
      order by x.ord
    ),
    output = jsonb_set(
      e.output,
      '{kcs}',
      coalesce(
        (
          select jsonb_agg(x.value - 'embedding' order by x.ord)
          from jsonb_array_elements(e.output -> 'kcs') with ordinality as x (value, ord)
        ),
        '[]'::jsonb
      )
    )
  from jsonb_array_elements(p_units) as u (value)
  where e.id = (u.value ->> 'extractionId')::uuid and e.course_id = p_course_id;

  update public.knowledge_map_builds
  set heartbeat_at = now()
  where course_id = p_course_id;
  return true;
end;
$$;

-- The developer view -------------------------------------------------------

-- As before (20261120100000), with each Exercise's question and solution
-- chunks in place of its solution chunk and the pairs.
create or replace function public.course_build_snapshot(p_course_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'course', jsonb_build_object('id', c.id, 'name', c.name, 'language', c.language),
    'materials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'name', m.name, 'position', m.position,
        'mediaType', m.media_type, 'parseStatus', m.parse_status,
        'parseFailure', m.parse_failure, 'pagesTotal', m.pages_total,
        'language', m.language, 'notes', m.notes
      ) order by m.position)
      from public.materials m where m.course_id = c.id
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'materialId', p.material_id, 'pageNumber', p.page_number,
        'skipped', p.skipped,
        'labels', (
          select coalesce(jsonb_agg(u ->> 'label'), '[]'::jsonb)
          from jsonb_array_elements(p.units) u
        )
      ) order by m.position, p.page_number)
      from public.material_pages p
      join public.materials m on m.id = p.material_id
      where m.course_id = c.id
    ), '[]'::jsonb),
    'chapters', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ch.id, 'materialId', ch.material_id, 'parentId', ch.parent_id,
        'depth', ch.depth, 'position', ch.position, 'title', ch.title,
        'pageFrom', ch.page_from, 'isExam', ch.is_exam,
        'examProposed', ch.exam_proposed
      ) order by ch.material_id, ch.position)
      from public.chapters ch where ch.course_id = c.id
    ), '[]'::jsonb),
    'chunks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'materialId', k.material_id, 'chapterId', k.chapter_id,
        'position', k.position, 'label', k.label, 'pageFrom', k.page_from,
        'pageTo', k.page_to, 'chars', length(k.markdown)
      ) order by k.material_id, k.position)
      from public.chunks k where k.course_id = c.id
    ), '[]'::jsonb),
    'extractions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'chapterId', e.chapter_id, 'kind', e.kind, 'unit', e.unit,
        'contentHash', e.content_hash, 'kcIds', e.kc_ids,
        'assumesMatched', e.assumes_matched, 'createdAt', e.created_at,
        'output', e.output
      ) order by e.chapter_id, e.kind, e.unit)
      from public.chapter_extractions e where e.course_id = c.id
    ), '[]'::jsonb),
    'kcs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', kc.id, 'name', kc.name, 'description', kc.description,
        'origin', kc.origin, 'position', kc.position, 'assumes', kc.assumes,
        'retiredAt', kc.retired_at,
        'sources', (
          select coalesce(jsonb_agg(s.chunk_id), '[]'::jsonb)
          from public.kc_sources s where s.kc_id = kc.id
        )
      ) order by kc.position)
      from public.kcs kc where kc.course_id = c.id
    ), '[]'::jsonb),
    'prerequisites', coalesce((
      select jsonb_agg(jsonb_build_object('from', l.from_kc, 'to', l.to_kc))
      from public.prerequisite_links l where l.course_id = c.id
    ), '[]'::jsonb),
    'exercises', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'position', x.position,
        'questionChunkId', x.question_chunk_id,
        'questionChunkIds', (
          select coalesce(jsonb_agg(ec.chunk_id order by ec.position), '[]'::jsonb)
          from public.exercise_chunks ec
          where ec.exercise_id = x.id and ec.role = 'question'
        ),
        'solutionChunkIds', (
          select coalesce(jsonb_agg(ec.chunk_id order by ec.position), '[]'::jsonb)
          from public.exercise_chunks ec
          where ec.exercise_id = x.id and ec.role = 'solution'
        ),
        'difficulty', x.difficulty, 'finalAnswers', x.final_answers
      ) order by x.position)
      from public.exercises x where x.course_id = c.id
    ), '[]'::jsonb),
    'exerciseKcs', coalesce((
      select jsonb_agg(jsonb_build_object('exerciseId', xk.exercise_id, 'kcId', xk.kc_id))
      from public.exercise_kcs xk where xk.course_id = c.id
    ), '[]'::jsonb),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'parentId', t.parent_id, 'position', t.position,
        'name', t.name, 'centralQuestion', t.central_question,
        'chapterIds', to_jsonb(t.chapter_ids),
        'kcIds', (
          select coalesce(jsonb_agg(tk.kc_id order by tk.position), '[]'::jsonb)
          from public.topic_kcs tk where tk.topic_id = t.id
        )
      ) order by t.position)
      from public.topics t where t.course_id = c.id
    ), '[]'::jsonb),
    'build', (
      select jsonb_build_object(
        'status', b.status, 'failureReason', b.failure_reason,
        'startedAt', b.started_at, 'finishedAt', b.finished_at,
        'heartbeatAt', b.heartbeat_at, 'needsUpdate', b.needs_update,
        'checkReport', b.check_report
      )
      from public.knowledge_map_builds b where b.course_id = c.id
    )
  )
  from public.courses c
  where c.id = p_course_id
$$;
