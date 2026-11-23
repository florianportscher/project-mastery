-- The app commit a Knowledge map build ran on, for the developer view and
-- agent inspect (#383). Set by the build's first step.
alter table public.knowledge_map_builds
  add column app_commit text;

comment on column public.knowledge_map_builds.app_commit is 'The short commit of the app that ran the build. Set when the build starts; null for builds before it was recorded.';

-- As before (20261123153700), with the build's app commit.
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
        'batch', e.batch, 'contentHash', e.content_hash,
        'promptDigest', e.prompt_digest, 'kcIds', e.kc_ids,
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
        'appCommit', b.app_commit,
        'checkReport', b.check_report
      )
      from public.knowledge_map_builds b where b.course_id = c.id
    )
  )
  from public.courses c
  where c.id = p_course_id
$$;
