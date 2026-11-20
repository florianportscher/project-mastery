-- Developer view of a Course's map build (#337). A developer account sees,
-- outside production, everything the parse and build stored for its own
-- Courses. Who is a developer is a row here, added on staging with
-- `agent staging-write`; no one can add themselves.

create table public.developers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.developers is 'Accounts that see the developer view of their own Courses outside production. Written only with the secret key.';

alter table public.developers enable row level security;

create policy "Developers can read their own row"
on public.developers for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.developers from anon, authenticated;
grant select on table public.developers to authenticated;

-- One jsonb of what the parse and build stored for a Course: the developer
-- page and `agent inspect` both read it, so the join exists once. Security
-- invoker: Row Level Security limits it to the caller's own Courses, and an
-- unknown or another Student's Course gives null. Chunk Markdown is left
-- out (`chars` gives its length); the page loads it per chunk.
create function public.course_build_snapshot(p_course_id uuid)
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
        'solutionChunkId', x.solution_chunk_id,
        'difficulty', x.difficulty, 'finalAnswers', x.final_answers
      ) order by x.position)
      from public.exercises x where x.course_id = c.id
    ), '[]'::jsonb),
    'exerciseKcs', coalesce((
      select jsonb_agg(jsonb_build_object('exerciseId', xk.exercise_id, 'kcId', xk.kc_id))
      from public.exercise_kcs xk where xk.course_id = c.id
    ), '[]'::jsonb),
    'exerciseSolutions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'exerciseChunkId', es.exercise_chunk_id,
        'solutionChunkId', es.solution_chunk_id, 'status', es.status
      ))
      from public.exercise_solutions es where es.course_id = c.id
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

comment on function public.course_build_snapshot(uuid) is 'What the parse and build stored for one Course, as one jsonb, for the developer view and agent inspect. Null for a Course the caller cannot read.';

revoke execute on function public.course_build_snapshot(uuid) from public, anon;
grant execute on function public.course_build_snapshot(uuid) to authenticated;

-- The read-only staging role (ADR 0025) exists on staging only.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'agent_reader') then
    grant execute on function public.course_build_snapshot(uuid) to agent_reader;
  end if;
end
$$;
