-- Parse without Outline (#351): chunks carry the heading they follow
-- instead of a Chapter, the page read answers each page's language and
-- notation, and unit extractions are keyed by Material, kind and batch.
-- Chapters go.

-- Page results ---------------------------------------------------------------

alter table public.material_pages
  add column language text,
  add column notes text;

comment on column public.material_pages.language is 'The language its page read gave for the pages, as an English name; null for a page stored without a read.';
comment on column public.material_pages.notes is 'The unusual notation its page read gave for the pages; null or empty when none.';

-- Chunks ---------------------------------------------------------------------

alter table public.chunks
  add column heading text;

comment on column public.chunks.heading is 'The heading it follows: the last heading unit at or before it in its Material; null before the first.';

-- An existing chunk follows its Chapter's title; the root's is none.
update public.chunks as k
set heading = ch.title
from public.chapters as ch
where ch.id = k.chapter_id and ch.depth > 0;

alter table public.chunks drop column chapter_id;

-- Unit extractions -----------------------------------------------------------

-- Their keys were Chapters; the build extracts every batch again.
delete from public.chapter_extractions;

alter table public.chapter_extractions rename to unit_extractions;
alter table public.unit_extractions drop column chapter_id;
alter table public.unit_extractions rename column unit to batch;
alter table public.unit_extractions
  add column material_id uuid not null references public.materials (id) on delete cascade,
  add constraint unit_extractions_material_id_kind_batch_key unique (material_id, kind, batch);
alter index public.chapter_extractions_owner_idx rename to unit_extractions_owner_idx;
alter index public.chapter_extractions_course_id_idx rename to unit_extractions_course_id_idx;
alter table public.unit_extractions rename constraint chapter_extractions_pkey to unit_extractions_pkey;

alter policy "Students can read their own chapter extractions"
  on public.unit_extractions rename to "Students can read their own unit extractions";

comment on table public.unit_extractions is 'The KCs and Prerequisites (and an exercise batch''s Exercises) the build extracted from one batch of a Material, kept while the batch''s content is unchanged.';
comment on column public.unit_extractions.batch is '0-based, among the Material''s batches of that kind.';

drop table public.chapters;

-- Storing chunks -------------------------------------------------------------

drop function public.replace_material_chunks(uuid, jsonb, jsonb);

-- Replaces the Material's chunks in one transaction; nothing when it is
-- gone. p_chunks: [{ position, page_from, page_to, label, markdown, heading }].
create function public.replace_material_chunks(
  p_material_id uuid,
  p_chunks jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_course_id uuid;
begin
  select owner, course_id into v_owner, v_course_id
  from public.materials
  where id = p_material_id
  for update;
  if not found then
    return;
  end if;

  delete from public.chunks where material_id = p_material_id;

  insert into public.chunks (
    owner, course_id, material_id, position, page_from, page_to, label,
    markdown, heading
  )
  select
    v_owner, v_course_id, p_material_id, c.position, c.page_from, c.page_to,
    c.label, c.markdown, c.heading
  from jsonb_to_recordset(p_chunks) as c (
    position integer, page_from integer, page_to integer, label text,
    markdown text, heading text
  );
end;
$$;

comment on function public.replace_material_chunks(uuid, jsonb) is
  'Replaces a Material''s chunks in one transaction. Parse workflow (service role) only.';

revoke execute on function public.replace_material_chunks(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_material_chunks(uuid, jsonb)
  to service_role;

-- Storing KCs ----------------------------------------------------------------

drop function public.store_chapter_kcs(uuid, jsonb, jsonb, jsonb);

-- As store_chapter_kcs before (20261121100000), on unit_extractions.
create function public.store_unit_kcs(
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

  update public.unit_extractions as e
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

comment on function public.store_unit_kcs(uuid, jsonb, jsonb, jsonb) is
  'Stores the KCs, sources, Prerequisites and Exercises of consolidated unit extractions while the build runs. Build workflow (service role) only.';

revoke execute on function public.store_unit_kcs(uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.store_unit_kcs(uuid, jsonb, jsonb, jsonb)
  to service_role;

-- As before (20261106120000), on unit_extractions.
create or replace function public.store_assumed_prerequisites(
  p_course_id uuid,
  p_prerequisites jsonb,
  p_assumes jsonb,
  p_matched jsonb,
  p_extraction_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select owner into v_owner
  from public.knowledge_map_builds
  where course_id = p_course_id and status = 'building'
  for update;
  if not found then
    return false;
  end if;

  insert into public.prerequisite_links (owner, course_id, from_kc, to_kc)
  select v_owner, p_course_id, f.id, t.id
  from jsonb_array_elements(p_prerequisites) as l (value)
  join public.kcs as f
    on f.id = (l.value ->> 'from')::uuid and f.course_id = p_course_id
  join public.kcs as t
    on t.id = (l.value ->> 'to')::uuid and t.course_id = p_course_id
  where f.id <> t.id
  on conflict (from_kc, to_kc) do nothing;

  update public.kcs as k
  set assumes = coalesce((
    select jsonb_agg(e.value order by e.ord)
    from jsonb_array_elements(k.assumes) with ordinality as e (value, ord)
    where not exists (
      select 1
      from jsonb_array_elements(p_matched) as m (value)
      where (m.value ->> 'kc')::uuid = k.id
        and lower(btrim(m.value ->> 'name')) = lower(btrim(e.value ->> 'name'))
    )
  ), '[]'::jsonb)
  where k.course_id = p_course_id
    and k.id in (
      select (m.value ->> 'kc')::uuid from jsonb_array_elements(p_matched) as m (value)
    );

  with incoming as (
    select distinct on ((a.value ->> 'kc')::uuid, lower(btrim(a.value ->> 'name')))
      (a.value ->> 'kc')::uuid as kc_id,
      btrim(a.value ->> 'name') as name,
      a.value ->> 'description' as description,
      a.ord
    from jsonb_array_elements(p_assumes) with ordinality as a (value, ord)
    order by (a.value ->> 'kc')::uuid, lower(btrim(a.value ->> 'name')), a.ord
  ),
  added as (
    select i.kc_id,
      jsonb_agg(
        jsonb_build_object('name', i.name, 'description', i.description)
        order by i.ord
      ) as entries
    from incoming as i
    join public.kcs as s on s.id = i.kc_id and s.course_id = p_course_id
    where not exists (
      select 1
      from jsonb_array_elements(s.assumes) as e (value)
      where lower(btrim(e.value ->> 'name')) = lower(i.name)
    )
    group by i.kc_id
  )
  update public.kcs as k
  set assumes = k.assumes || added.entries
  from added
  where k.id = added.kc_id;

  update public.unit_extractions
  set assumes_matched = true
  where course_id = p_course_id and id = any (p_extraction_ids);

  update public.knowledge_map_builds
  set heartbeat_at = now()
  where course_id = p_course_id;
  return true;
end;
$$;

-- The developer view -------------------------------------------------------

-- As before (20261122100000), without Chapters: chunks with their heading,
-- extractions by Material, kind and batch.
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
    'chunks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'materialId', k.material_id, 'heading', k.heading,
        'position', k.position, 'label', k.label, 'pageFrom', k.page_from,
        'pageTo', k.page_to, 'chars', length(k.markdown)
      ) order by k.material_id, k.position)
      from public.chunks k where k.course_id = c.id
    ), '[]'::jsonb),
    'extractions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'materialId', e.material_id, 'kind', e.kind,
        'batch', e.batch, 'contentHash', e.content_hash, 'kcIds', e.kc_ids,
        'assumesMatched', e.assumes_matched, 'createdAt', e.created_at,
        'output', e.output
      ) order by e.material_id, e.kind, e.batch)
      from public.unit_extractions e where e.course_id = c.id
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
    'exams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ex.id, 'name', ex.name, 'position', ex.position,
        'confirmed', ex.confirmed, 'asked', ex.asked
      ) order by ex.position)
      from public.exams ex where ex.course_id = c.id
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
        'examId', x.exam_id,
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

-- Every map needs Update map, which extracts the new batches.
update public.knowledge_map_builds set needs_update = true;
