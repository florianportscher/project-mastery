-- Old exams as records (#350): the build's grouping call finds old exams in
-- any Material and names each as printed; the Brief asks about each once
-- and the Student confirms or rejects it. A confirmed exam's Exercises count
-- for Priority and Mock exams. The Chapters' exam flags, the exam-title
-- heuristic and "old exams teach nothing" go. Pre-launch, nothing carries
-- over: the Brief asks again after the next build.

-- Exams -------------------------------------------------------------------------

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 300),
  -- 0-based, in Course order of the exam's first Exercise.
  position integer not null check (position >= 0),
  confirmed boolean,
  asked boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.exams is 'An old exam the build''s grouping call found in the Course''s Materials, a set of Exercises (exercises.exam_id).';
comment on column public.exams.name is 'The exam''s name as printed, such as "Klausur WS 2023/24".';
comment on column public.exams.confirmed is 'The Student''s answer in the Brief: an old exam (true) or not (false); null until they answered.';
comment on column public.exams.asked is 'Whether the Brief has asked about the exam.';

create index exams_owner_idx on public.exams (owner);
create index exams_course_id_idx on public.exams (course_id);

alter table public.exams enable row level security;

create policy "Students can read their own exams"
on public.exams
for select
to authenticated
using ((select auth.uid()) = owner);

-- `save_brief` writes the answers as the caller.
create policy "Students can update their own exams"
on public.exams
for update
to authenticated
using ((select auth.uid()) = owner)
with check ((select auth.uid()) = owner);

revoke all on table public.exams from anon, authenticated;
grant select on table public.exams to authenticated;
grant update (confirmed, asked) on table public.exams to authenticated;

alter table public.exercises
  add column exam_id uuid references public.exams (id) on delete set null;

comment on column public.exercises.exam_id is 'The old exam the Exercise belongs to, as the grouping call found it; null for none.';

create index exercises_exam_id_idx on public.exercises (exam_id);

-- The Reserved exam and the final mock name an exam --------------------------------

drop trigger briefs_check_reserved_exam on public.briefs;

alter table public.briefs drop column reserved_exam_chapter_id;

-- The reserved old exam; null when none is reserved, or when the exam is
-- gone after a build.
alter table public.briefs
  add column reserved_exam_id uuid references public.exams (id) on delete set null;

create index briefs_reserved_exam_id_idx on public.briefs (reserved_exam_id);

-- The Brief asks about the reservation again.
update public.briefs set reserved_exam_answered = false;

grant update (reserved_exam_id) on table public.briefs to authenticated;

-- A reserved exam must be a confirmed old exam of the Brief's own Course.
-- Runs as the caller, so Row Level Security hides another Student's exams.
create or replace function private.check_reserved_exam()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.reserved_exam_id is not null and not exists (
    select 1 from public.exams e
    where e.id = new.reserved_exam_id
      and e.course_id = new.course_id
      and e.confirmed is true
  ) then
    raise exception 'The reserved exam must be an old exam of the Course'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger briefs_check_reserved_exam
before insert or update of reserved_exam_id on public.briefs
for each row execute function private.check_reserved_exam();

alter table public.mock_exams drop column reserved_chapter_id;

-- The reserved exam a final mock is; null for every other mock.
alter table public.mock_exams
  add column reserved_exam_id uuid references public.exams (id) on delete set null;

create index mock_exams_reserved_exam_id_idx on public.mock_exams (reserved_exam_id);

-- The Chapters' exam flags go ------------------------------------------------------

drop trigger chapters_exam_marks_map on public.chapters;
drop policy "Students can update their own chapters" on public.chapters;
revoke update on table public.chapters from authenticated;

alter table public.chapters
  drop column is_exam,
  drop column exam_asked,
  drop column exam_proposed;

-- As before (20261101100000), without the old-exam flags: p_chapters'
-- objects have position, parent_position, depth, title and page_from.
create or replace function public.replace_material_chunks(
  p_material_id uuid,
  p_chapters jsonb,
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
  delete from public.chapters where material_id = p_material_id;

  -- Ids first, so a Chapter's parent is found by its position. A parent
  -- position without a Chapter leaves the parent null, which only the root
  -- may have.
  with c as (
    select gen_random_uuid() as id, r.*
    from jsonb_to_recordset(p_chapters) as r (
      position integer, parent_position integer, depth integer, title text,
      page_from integer
    )
  )
  insert into public.chapters (
    id, owner, course_id, material_id, parent_id, position, depth, title,
    page_from
  )
  select
    c.id, v_owner, v_course_id, p_material_id, parent.id, c.position, c.depth,
    c.title, c.page_from
  from c
  left join c as parent on parent.position = c.parent_position;

  insert into public.chunks (
    owner, course_id, material_id, chapter_id, position, page_from, page_to,
    label, markdown
  )
  select
    v_owner, v_course_id, p_material_id, chapter.id, c.position, c.page_from,
    c.page_to, c.label, c.markdown
  from jsonb_to_recordset(p_chunks) as c (
    position integer, page_from integer, page_to integer, label text,
    markdown text, chapter_position integer
  )
  left join public.chapters as chapter
    on chapter.material_id = p_material_id
    and chapter.position = c.chapter_position;
end;
$$;

-- Old exams teach like any other Material again: only KCs without sources
-- are retired.
create or replace function public.retire_unsourced_kcs(p_course_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_retired integer;
begin
  update public.kcs as k
  set retired_at = now()
  where k.course_id = p_course_id
    and k.retired_at is null
    and not exists (select 1 from public.kc_sources as s where s.kc_id = k.id);
  get diagnostics v_retired = row_count;

  delete from public.topic_kcs as t
  using public.kcs as k
  where t.kc_id = k.id and k.course_id = p_course_id and k.retired_at is not null;
  return v_retired;
end;
$$;

comment on function public.retire_unsourced_kcs(uuid) is
  'Retires the Course''s KCs whose sources are all gone and takes them out of their Topics. Build workflow (service role) only.';

-- The build's exams ---------------------------------------------------------------

-- Gives each listed Exercise of the Course (by its first question chunk)
-- its exam, an exam of the same Course or null; every Exercise not listed
-- gets none. Build workflow (service role) only.
create function public.set_exercise_exams(
  p_course_id uuid,
  p_exercises jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.exercises as e
  set exam_id = x.exam_id
  from (
    select (v.value ->> 'questionChunkId')::uuid as question_chunk_id, ex.id as exam_id
    from jsonb_array_elements(p_exercises) as v (value)
    left join public.exams as ex
      on ex.id = (v.value ->> 'examId')::uuid and ex.course_id = p_course_id
  ) as x
  where e.course_id = p_course_id
    and e.question_chunk_id = x.question_chunk_id
    and e.exam_id is distinct from x.exam_id;

  update public.exercises as e
  set exam_id = null
  where e.course_id = p_course_id
    and e.exam_id is not null
    and not exists (
      select 1 from jsonb_array_elements(p_exercises) as v (value)
      where (v.value ->> 'questionChunkId')::uuid = e.question_chunk_id
    );
$$;

revoke execute on function public.set_exercise_exams(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.set_exercise_exams(uuid, jsonb)
  to service_role;

-- save_brief ------------------------------------------------------------------------

drop function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text);

-- Changes the given fields of the caller's Brief, all or nothing:
-- - `excluded_material_ids`, unless null, replaces the excluded Materials.
-- - `exam_ids`, unless null, are the Course's confirmed old exams: they
--   become confirmed, and every other exam that was, or that is among
--   `asked_exam_ids`, becomes rejected; the rest stay unanswered. The exams
--   among `asked_exam_ids` count as asked. A Reserved exam that is no
--   longer confirmed loses its reservation, so the Brief asks again.
-- - `course_language`, unless null, becomes the Course's language.
create function public.save_brief(
  course_id uuid,
  fields jsonb default '{}',
  excluded_material_ids uuid[] default null,
  exam_ids uuid[] default null,
  asked_exam_ids uuid[] default null,
  course_language text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.briefs b
  where b.course_id = save_brief.course_id
  for update;
  if not found then
    return false;
  end if;

  if exam_ids is not null then
    update public.exams e
    set
      confirmed = case
        when e.id = any (exam_ids) then true
        when e.confirmed is true or e.id = any (coalesce(asked_exam_ids, '{}')) then false
        else e.confirmed
      end,
      asked = e.asked or e.id = any (coalesce(asked_exam_ids, '{}'))
    where e.course_id = save_brief.course_id;

    update public.briefs b
    set reserved_exam_id = null, reserved_exam_answered = false
    where b.course_id = save_brief.course_id
      and b.reserved_exam_id is not null
      and not b.reserved_exam_id = any (exam_ids);
  end if;

  update public.briefs b
  set
    exam_date = case when fields ? 'exam_date' then (fields ->> 'exam_date')::date else b.exam_date end,
    goal = case when fields ? 'goal' then fields ->> 'goal' else b.goal end,
    open_book = case when fields ? 'open_book' then (fields ->> 'open_book')::boolean else b.open_book end,
    formula_sheet = case when fields ? 'formula_sheet' then (fields ->> 'formula_sheet')::boolean else b.formula_sheet end,
    calculator = case when fields ? 'calculator' then (fields ->> 'calculator')::boolean else b.calculator end,
    scope_confirmed = case when fields ? 'scope_confirmed' then (fields ->> 'scope_confirmed')::boolean else b.scope_confirmed end,
    reserved_exam_id = case when fields ? 'reserved_exam_id' then (fields ->> 'reserved_exam_id')::uuid else b.reserved_exam_id end,
    reserved_exam_answered = case when fields ? 'reserved_exam_answered' then (fields ->> 'reserved_exam_answered')::boolean else b.reserved_exam_answered end
  where b.course_id = save_brief.course_id;

  if excluded_material_ids is not null then
    delete from public.brief_excluded_materials e
    where e.course_id = save_brief.course_id;
    insert into public.brief_excluded_materials (course_id, material_id)
    select distinct save_brief.course_id, m.id
    from unnest(excluded_material_ids) as m (id);
  end if;

  if course_language is not null then
    update public.courses c
    set language = course_language
    where c.id = save_brief.course_id;
  end if;
  return true;
end;
$$;

comment on function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text) is 'Changes the given fields and, unless null, the excluded Materials, the confirmed old exams and the Course language of the caller''s Brief, marking the listed exams asked, all or nothing; false without a Brief.';

revoke execute on function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text) from public, anon;
grant execute on function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text) to authenticated;

-- The developer view -------------------------------------------------------

-- As before (20261121100000), with the Course's exams and each Exercise's
-- exam in place of the Chapters' exam flags.
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
        'pageFrom', ch.page_from
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

-- Every map needs Update map, which finds the exams.
update public.knowledge_map_builds
set needs_update = true, exercise_grouping_hash = null;
