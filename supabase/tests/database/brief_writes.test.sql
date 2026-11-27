-- Tests for public.save_brief and public.add_brief_note, the writes of the
-- Brief's tools. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(19);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

insert into public.courses (id, owner, name)
values
  ('aaaaaaaa-c000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Algebra'),
  ('bbbbbbbb-c000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Biology');

insert into public.materials (id, owner, course_id, name, storage_path, media_type, size_bytes)
values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-c000-0000-0000-000000000001', 'Old exam', '11111111-1111-1111-1111-111111111111/aaaaaaaa-c000-0000-0000-000000000001/aaaaaaaa-0000-0000-0000-0000000000f1', 'application/pdf', 10),
  ('aaaaaaaa-0000-0000-0000-0000000000f2', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-c000-0000-0000-000000000001', 'Lecture', '11111111-1111-1111-1111-111111111111/aaaaaaaa-c000-0000-0000-000000000001/aaaaaaaa-0000-0000-0000-0000000000f2', 'application/pdf', 10),
  ('bbbbbbbb-0000-0000-0000-0000000000f1', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-c000-0000-0000-000000000001', 'Notes', '22222222-2222-2222-2222-222222222222/bbbbbbbb-c000-0000-0000-000000000001/bbbbbbbb-0000-0000-0000-0000000000f1', 'application/pdf', 10);

insert into public.briefs (course_id, owner)
values
  ('aaaaaaaa-c000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-c000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select ok(
  public.save_brief(
    'aaaaaaaa-c000-0000-0000-000000000001',
    '{"exam_date": "2026-12-03", "open_book": true, "calculator": true, "scope_confirmed": true}',
    array['aaaaaaaa-0000-0000-0000-0000000000f1']::uuid[]
  ),
  'save_brief saves the given fields'
);

select results_eq(
  $$select exam_date, open_book, calculator, scope_confirmed, goal from public.briefs where course_id = 'aaaaaaaa-c000-0000-0000-000000000001'$$,
  $$values ('2026-12-03'::date, true, true, true, null::text)$$,
  'only the given fields change'
);

select ok(
  public.save_brief('aaaaaaaa-c000-0000-0000-000000000001', '{"goal": "pass"}'),
  'save_brief without excluded Materials keeps the set'
);

select results_eq(
  $$select material_id from public.brief_excluded_materials$$,
  $$values ('aaaaaaaa-0000-0000-0000-0000000000f1'::uuid)$$,
  'the excluded set is kept'
);

select throws_ok(
  $$select public.save_brief('aaaaaaaa-c000-0000-0000-000000000001', '{"open_book": false}', array['aaaaaaaa-0000-0000-0000-0000000000f2', 'bbbbbbbb-0000-0000-0000-0000000000f1']::uuid[])$$,
  '42501',
  null,
  'save_brief refuses another Student''s Material'
);

select results_eq(
  $$select b.open_book, (select array_agg(material_id) from public.brief_excluded_materials) from public.briefs b where course_id = 'aaaaaaaa-c000-0000-0000-000000000001'$$,
  $$values (true, array['aaaaaaaa-0000-0000-0000-0000000000f1']::uuid[])$$,
  'a failed save_brief changes nothing'
);

select is(
  public.save_brief('bbbbbbbb-c000-0000-0000-000000000001', '{"goal": "pass"}'),
  false,
  'save_brief does not see another Student''s Brief'
);

select public.add_brief_note('aaaaaaaa-c000-0000-0000-000000000001', 'First.');
select public.add_brief_note('aaaaaaaa-c000-0000-0000-000000000001', 'Second.');

select is(
  (select notes from public.briefs where course_id = 'aaaaaaaa-c000-0000-0000-000000000001'),
  E'First.\n\nSecond.',
  'add_brief_note appends after a blank line'
);

select isnt(
  (select notes_updated_at from public.briefs where course_id = 'aaaaaaaa-c000-0000-0000-000000000001'),
  null,
  'add_brief_note sets notes_updated_at'
);

select is(
  public.add_brief_note('aaaaaaaa-c000-0000-0000-000000000001', repeat('x', 20000)),
  false,
  'add_brief_note refuses notes past the limit'
);

-- The reserved exams: two exams the Student confirmed, one not yet answered,
-- and Bob's confirmed exam.
reset role;
insert into public.exams (id, owner, course_id, name, position, confirmed)
values
  ('aaaaaaaa-0e00-0000-0000-0000000000f1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-c000-0000-0000-000000000001', 'Old exam', 0, true),
  ('aaaaaaaa-0e00-0000-0000-0000000000f2', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-c000-0000-0000-000000000001', 'Klausur 2023', 1, null),
  ('aaaaaaaa-0e00-0000-0000-0000000000f3', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-c000-0000-0000-000000000001', 'Klausur 2024', 2, true),
  ('bbbbbbbb-0e00-0000-0000-0000000000f1', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-c000-0000-0000-000000000001', 'Notes', 0, true);
set local role authenticated;

select ok(
  public.save_brief(
    'aaaaaaaa-c000-0000-0000-000000000001',
    '{"reserved_exam_answered": true}',
    reserved_exam_ids => array['aaaaaaaa-0e00-0000-0000-0000000000f1', 'aaaaaaaa-0e00-0000-0000-0000000000f3']::uuid[]
  ),
  'save_brief reserves several confirmed old exams'
);

select results_eq(
  $$select name from public.exams where reserved and course_id = 'aaaaaaaa-c000-0000-0000-000000000001' order by position$$,
  $$values ('Old exam'), ('Klausur 2024')$$,
  'both exams are reserved'
);

select public.save_brief(
  'aaaaaaaa-c000-0000-0000-000000000001',
  reserved_exam_ids => array['aaaaaaaa-0e00-0000-0000-0000000000f1', 'aaaaaaaa-0e00-0000-0000-0000000000f2']::uuid[]
);

select results_eq(
  $$select name from public.exams where reserved and course_id = 'aaaaaaaa-c000-0000-0000-000000000001' order by position$$,
  $$values ('Old exam')$$,
  'the set is replaced, and an exam the Student did not confirm is not reserved'
);

select throws_ok(
  $$update public.exams set reserved = true where id = 'aaaaaaaa-0e00-0000-0000-0000000000f2'$$,
  '23514',
  null,
  'an exam the Student did not confirm cannot be reserved directly'
);

select is_empty(
  $$update public.exams set reserved = true where id = 'bbbbbbbb-0e00-0000-0000-0000000000f1' returning id$$,
  'another Student''s exam cannot be reserved'
);

select public.save_brief(
  'aaaaaaaa-c000-0000-0000-000000000001',
  reserved_exam_ids => array['aaaaaaaa-0e00-0000-0000-0000000000f1', 'aaaaaaaa-0e00-0000-0000-0000000000f3']::uuid[]
);
select public.save_brief(
  'aaaaaaaa-c000-0000-0000-000000000001',
  exam_ids => array['aaaaaaaa-0e00-0000-0000-0000000000f1']::uuid[]
);

select results_eq(
  $$select e.name, b.reserved_exam_answered from public.exams e, public.briefs b where e.reserved and e.course_id = 'aaaaaaaa-c000-0000-0000-000000000001' and b.course_id = e.course_id$$,
  $$values ('Old exam', true)$$,
  'an exam that is no longer confirmed loses its reservation, the Brief keeps its answer'
);

select public.save_brief(
  'aaaaaaaa-c000-0000-0000-000000000001',
  exam_ids => array[]::uuid[]
);

select results_eq(
  $$select count(*) filter (where e.reserved), bool_or(b.reserved_exam_answered) from public.exams e, public.briefs b where e.course_id = 'aaaaaaaa-c000-0000-0000-000000000001' and b.course_id = e.course_id$$,
  $$values (0::bigint, false)$$,
  'dropping the last reservation makes the Brief ask again'
);

select ok(
  public.save_brief('aaaaaaaa-c000-0000-0000-000000000001', course_language => 'German'),
  'save_brief sets the Course language'
);

select is(
  (select language from public.courses where id = 'aaaaaaaa-c000-0000-0000-000000000001'),
  'German',
  'the Course language is stored'
);

select * from finish();
rollback;
