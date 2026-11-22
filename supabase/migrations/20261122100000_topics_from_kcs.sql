-- Topics from KCs (#351): the tree call groups KCs, not Chapters, so a
-- Topic no longer records the Chapters it covers.

alter table public.topics
  drop constraint topics_own_kcs_check,
  drop column chapter_ids;

comment on table public.topics is 'A Topic of the Course''s Topic tree: KCs learned together as one subject with the question they answer, and child Topics.';
comment on column public.topics.central_question is 'The question its own KCs together answer; null for a Topic that only holds child Topics.';

comment on column public.knowledge_map_builds.topic_tree_hash is 'The hash of the KCs and language the stored Topic tree was built from; null before one.';

-- Ending a build ------------------------------------------------------------------

-- As before (20261101120000), with each Topic of p_topics { id, parent,
-- name, centralQuestion, kcs }.
create or replace function public.arrange_knowledge_map(
  p_course_id uuid,
  p_kcs jsonb,
  p_topics jsonb,
  p_topic_tree_hash text,
  p_dropped_prerequisites jsonb default '[]',
  p_check_report jsonb default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  -- Above every position, so renumbering never meets a taken one.
  v_offset constant integer := 1000000;
  v_owner uuid;
  v_ids jsonb;
begin
  select owner into v_owner
  from public.knowledge_map_builds
  where course_id = p_course_id and status = 'building'
  for update;
  if not found then
    return false;
  end if;

  update public.kcs set position = position + v_offset
  where course_id = p_course_id;
  update public.kcs as k
  set position = x.ord - 1
  from jsonb_array_elements_text(p_kcs) with ordinality as x (id, ord)
  where k.id = x.id::uuid and k.course_id = p_course_id;
  update public.kcs as k
  set position = jsonb_array_length(p_kcs) + r.rank - 1
  from (
    select id, row_number() over (order by position) as rank
    from public.kcs
    where course_id = p_course_id and position >= v_offset
  ) as r
  where k.id = r.id;

  -- Topics ---------------------------------------------------------------------

  -- Row ids by 0-based place in the array.
  select coalesce(
    jsonb_object_agg((e.ord - 1)::text, coalesce(r.id, gen_random_uuid())),
    '{}'
  )
  into v_ids
  from jsonb_array_elements(p_topics) with ordinality as e (value, ord)
  left join public.topics as r
    on r.course_id = p_course_id and r.id::text = e.value ->> 'id';

  insert into public.topics (
    id, owner, course_id, parent_id, name, central_question, position
  )
  select
    (v_ids ->> (e.ord - 1)::text)::uuid, v_owner, p_course_id,
    (v_ids ->> (e.value ->> 'parent'))::uuid,
    e.value ->> 'name', e.value ->> 'centralQuestion',
    e.ord - 1
  from jsonb_array_elements(p_topics) with ordinality as e (value, ord)
  on conflict (id) do update
  set parent_id = excluded.parent_id,
    name = excluded.name,
    central_question = excluded.central_question,
    position = excluded.position;

  -- After the update, so no kept Topic still sits in one that goes.
  delete from public.topics
  where course_id = p_course_id
    and id not in (select value::uuid from jsonb_each_text(v_ids));

  delete from public.topic_kcs as t
  using public.topics as o
  where t.topic_id = o.id and o.course_id = p_course_id;

  insert into public.topic_kcs (topic_id, kc_id, owner, position)
  select (v_ids ->> (e.ord - 1)::text)::uuid, k.id, v_owner, x.ord - 1
  from jsonb_array_elements(p_topics) with ordinality as e (value, ord)
  cross join jsonb_array_elements_text(e.value -> 'kcs') with ordinality as x (kc_id, ord)
  join public.kcs as k on k.id::text = x.kc_id and k.course_id = p_course_id
  on conflict do nothing;

  -- Prerequisites and Exercises --------------------------------------------

  delete from public.prerequisite_links as l
  using jsonb_array_elements(p_dropped_prerequisites) as d (value)
  where l.course_id = p_course_id
    and l.from_kc = (d.value ->> 'from')::uuid
    and l.to_kc = (d.value ->> 'to')::uuid;

  update public.exercises set position = position + v_offset
  where course_id = p_course_id;
  update public.exercises as e
  set position = r.rank - 1
  from (
    select x.id, row_number() over (order by m.position, c.position, x.id) as rank
    from public.exercises as x
    join public.chunks as c on c.id = x.question_chunk_id
    join public.materials as m on m.id = c.material_id
    where x.course_id = p_course_id
  ) as r
  where e.id = r.id;

  update public.knowledge_map_builds
  set status = 'built', failure_reason = null, finished_at = now(),
    heartbeat_at = now(), check_report = p_check_report,
    topic_tree_hash = p_topic_tree_hash
  where course_id = p_course_id;
  return true;
end;
$$;

-- The developer view -------------------------------------------------------

-- As before (20261121110000), without the Topics' Chapters.
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

-- Every map needs Update map, which builds the tree from KCs.
update public.knowledge_map_builds set needs_update = true;
