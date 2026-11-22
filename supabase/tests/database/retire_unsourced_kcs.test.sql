-- The build's last writes (#350): `retire_unsourced_kcs` retires the KCs
-- whose sources are all gone, an old exam's content among them, and
-- `set_exercise_exams` gives each Exercise its exam of the same Course.
-- Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');
insert into public.courses (id, owner, name)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Algebra'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Biology');
insert into public.materials (id, owner, course_id, name, media_type, size_bytes, storage_path, parse_status)
values ('aaaaaaaa-1111-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-0000-0000-0000-000000000001', 'Script', 'application/pdf', 1000,
  '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/aaaaaaaa-1111-0000-0000-000000000001',
  'parsed');
select public.replace_material_chunks('aaaaaaaa-1111-0000-0000-000000000001',
  '[{"position": 0, "page_from": 1, "page_to": 1, "label": "content", "markdown": "Exam text.", "heading": "Final exam"},
    {"position": 1, "page_from": 2, "page_to": 2, "label": "exercise", "markdown": "Find a basis.", "heading": "Final exam"},
    {"position": 2, "page_from": 2, "page_to": 2, "label": "exercise", "markdown": "Find a kernel.", "heading": "Final exam"}]');

insert into public.kcs (id, owner, course_id, name, description, origin, position)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Basis', 'A spanning independent family.', 'content', 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Gone', 'Its chunk is gone.', 'content', 1);
insert into public.kc_sources (kc_id, chunk_id, owner, course_id)
select 'bbbbbbbb-0000-0000-0000-000000000001', c.id, c.owner, c.course_id
from public.chunks as c where c.markdown = 'Exam text.';

select is(public.retire_unsourced_kcs('aaaaaaaa-0000-0000-0000-000000000001'), 1,
  'a KC without sources retires');
select results_eq(
  $$select name from public.kcs where retired_at is null and course_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  $$values ('Basis'::text)$$,
  'a KC taught in an old exam''s content stays');

-- Two Exercises, an exam of the Course and one of Bob's.
insert into public.exams (id, owner, course_id, name, position)
values
  ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'Final exam', 0),
  ('eeeeeeee-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-0000-0000-0000-000000000001', 'Midterm', 0);
insert into public.exercises (owner, course_id, question_chunk_id, position, difficulty, exam_id)
select c.owner, c.course_id, c.id, c.position, 1,
  case when c.markdown = 'Find a kernel.' then 'eeeeeeee-0000-0000-0000-000000000001'::uuid end
from public.chunks as c
where c.label = 'exercise' and c.course_id = 'aaaaaaaa-0000-0000-0000-000000000001';

select public.set_exercise_exams('aaaaaaaa-0000-0000-0000-000000000001', jsonb_build_array(
  jsonb_build_object('questionChunkId', (select id from public.chunks where markdown = 'Find a basis.'),
    'examId', 'eeeeeeee-0000-0000-0000-000000000001')));

select results_eq(
  $$select c.markdown, e.exam_id from public.exercises e join public.chunks c on c.id = e.question_chunk_id
    where e.course_id = 'aaaaaaaa-0000-0000-0000-000000000001' order by c.position$$,
  $$values ('Find a basis.'::text, 'eeeeeeee-0000-0000-0000-000000000001'::uuid), ('Find a kernel.', null)$$,
  'set_exercise_exams sets the listed exams and clears the unlisted');

select public.set_exercise_exams('aaaaaaaa-0000-0000-0000-000000000001', jsonb_build_array(
  jsonb_build_object('questionChunkId', (select id from public.chunks where markdown = 'Find a basis.'),
    'examId', 'eeeeeeee-0000-0000-0000-000000000002')));

select is(
  (select exam_id from public.exercises e join public.chunks c on c.id = e.question_chunk_id where c.markdown = 'Find a basis.'),
  null, 'another Course''s exam is no exam of the Exercise');

select * from finish();
rollback;
