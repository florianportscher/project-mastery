-- Developer view (#337): `course_build_snapshot` returns what the parse and
-- build stored for a Course, joined, for its owner only, and a developer
-- reads their own `developers` row and writes none. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');
insert into public.developers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.courses (id, owner, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Algebra');
insert into public.knowledge_map_builds (course_id, owner, status, check_report)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'built',
  '{"chaptersWithoutKcs": ["Groups"]}');
insert into public.materials (id, owner, course_id, name, media_type, size_bytes, storage_path, parse_status)
values ('aaaaaaaa-1111-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-0000-0000-0000-000000000001', 'Lecture 1', 'application/pdf', 1000,
  '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/aaaaaaaa-1111-0000-0000-000000000001',
  'parsed');
insert into public.material_pages (owner, material_id, page_number, units, skipped)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-0000-0000-000000000001', 1,
    '[{"label": "content", "markdown": "A vector."}, {"label": "exercise", "markdown": "Add."}]', null),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-0000-0000-000000000001', 2, '[]', 'unreadable');
select public.replace_material_chunks('aaaaaaaa-1111-0000-0000-000000000001',
  '[{"position": 0, "parent_position": null, "depth": 0, "title": "Lecture 1", "page_from": 1}]', '[]');
insert into public.chunks (id, owner, course_id, material_id, chapter_id, position, page_from, page_to, label, markdown)
select 'cccccccc-0000-0000-0000-000000000001', owner, course_id, material_id, id, 0, 1, 1, 'content', 'A vector.'
from public.chapters where course_id = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.chunks (id, owner, course_id, material_id, position, page_from, page_to, label, markdown)
values ('cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 1, 1, 1, 'exercise', 'Add.');
insert into public.chapter_extractions (chapter_id, owner, course_id, kind, unit, content_hash, output, kc_ids)
select id, owner, course_id, 'content', 0, repeat('a', 64), '{"kcs": [], "prerequisites": []}',
  '{bbbbbbbb-0000-0000-0000-000000000001}'
from public.chapters where course_id = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.kcs (id, owner, course_id, name, description, origin, position)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Vector', 'An element.', 'content', 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Sum', 'Adding vectors.', 'exercise', 1);
insert into public.kc_sources (kc_id, chunk_id, owner, course_id)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.prerequisite_links (from_kc, to_kc, owner, course_id)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.exercises (id, owner, course_id, question_chunk_id, difficulty, position)
values ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 1, 0);
insert into public.exercise_kcs (exercise_id, kc_id, owner, course_id)
values ('eeeeeeee-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.topics (id, owner, course_id, chapter_ids, name, central_question, position)
select 'dddddddd-0000-0000-0000-000000000001', owner, course_id, array[id], 'Vectors', 'What is a vector?', 0
from public.chapters where course_id = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.topic_kcs (topic_id, kc_id, owner, position)
values ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111', 0);

-- Alice, the owner, gets her Course joined.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
create temp table snap as
  select public.course_build_snapshot('aaaaaaaa-0000-0000-0000-000000000001') as s;

select is((select s -> 'pages' -> 0 -> 'labels' from snap), '["content", "exercise"]'::jsonb,
  'a page lists the labels of its units, not their Markdown');
select is((select s -> 'pages' -> 1 ->> 'skipped' from snap), 'unreadable', 'a skipped page keeps its reason');
select is((select s -> 'chunks' -> 0 -> 'chars' from snap), '9'::jsonb,
  'a chunk gives its length instead of its Markdown');
select is((select s -> 'chunks' -> 0 ? 'markdown' from snap), false, 'no chunk carries Markdown');
select is((select s -> 'kcs' -> 0 -> 'sources' from snap), '["cccccccc-0000-0000-0000-000000000001"]'::jsonb,
  'a KC lists its source chunks');
select is(
  (select jsonb_build_array(
    jsonb_array_length(s -> 'extractions'), jsonb_array_length(s -> 'prerequisites'),
    jsonb_array_length(s -> 'exercises'), s -> 'exerciseKcs' -> 0 ->> 'kcId',
    s -> 'topics' -> 0 -> 'kcIds' -> 0, s -> 'build' -> 'checkReport' -> 'chaptersWithoutKcs')
   from snap),
  '[1, 1, 1, "bbbbbbbb-0000-0000-0000-000000000002", "bbbbbbbb-0000-0000-0000-000000000001", ["Groups"]]'::jsonb,
  'extractions, Prerequisites, Exercises with their KCs, Topics with theirs and the build come along');
select is((select count(*)::int from public.developers), 1, 'a developer reads their own row');
select throws_ok(
  $$insert into public.developers (user_id) values ('22222222-2222-2222-2222-222222222222')$$,
  '42501', null, 'no one adds a developer from the app');

-- Bob gets nothing of Alice's Course and is no developer.
select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);
select is(public.course_build_snapshot('aaaaaaaa-0000-0000-0000-000000000001'), null,
  'another Student gets nothing');
select is((select count(*)::int from public.developers), 0, 'another account reads no developer row');

select * from finish();
rollback;
