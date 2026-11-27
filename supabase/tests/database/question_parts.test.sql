-- The parts of a Question (#448): a Student adds parts only to their own
-- Question, on a KC it tests, fills in only the answer and the grade, and
-- reads only their own parts. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

insert into public.courses (id, owner, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Jet engines');

insert into public.kcs (id, owner, course_id, name, description, origin, position)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Thrust', 'F = ṁ Δv.', 'content', 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Nozzles', 'Accelerate the flow.', 'content', 1);

insert into public.chats (id, owner, course_id)
values ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.questions (id, owner, session_id, prompt)
select 'dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', id, 'A jet engine.'
from public.study_sessions where chat_id = 'cccccccc-0000-0000-0000-000000000001';

insert into public.question_kcs (question_id, kc_id)
values ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$insert into public.question_parts (question_id, position, prompt, kc_id, form)
    values ('dddddddd-0000-0000-0000-000000000001', 1, 'Name the force.', 'bbbbbbbb-0000-0000-0000-000000000001', 'short')$$,
  'the owner adds a part on a KC the Question tests');
select throws_ok(
  $$insert into public.question_parts (question_id, position, prompt, kc_id, form)
    values ('dddddddd-0000-0000-0000-000000000001', 2, 'Why a nozzle?', 'bbbbbbbb-0000-0000-0000-000000000002', 'long')$$,
  '42501', null, 'a part on a KC the Question does not test is refused');
select throws_ok(
  $$insert into public.question_parts (question_id, position, prompt, kc_id, form)
    values ('dddddddd-0000-0000-0000-000000000001', 3, 'Which?', 'bbbbbbbb-0000-0000-0000-000000000001', 'choice')$$,
  '23514', null, 'a choice part without options is refused');
select throws_ok(
  $$insert into public.question_parts (question_id, position, prompt, kc_id, form)
    values ('dddddddd-0000-0000-0000-000000000001', 7, 'Seventh?', 'bbbbbbbb-0000-0000-0000-000000000001', 'short')$$,
  '23514', null, 'a seventh part is refused');

select lives_ok(
  $$update public.question_parts set answer_text = 'Thrust', result = 'full', note = 'Right.'$$,
  'the owner stores the answer and the grade');
select throws_ok(
  $$update public.question_parts set prompt = 'Easier?'$$,
  '42501', null, 'what was asked never changes');
select throws_ok(
  $$update public.question_parts set note = repeat('x', 301)$$,
  '23514', null, 'a note over 300 characters is refused');

select is(
  (select public.record_question_move('dddddddd-0000-0000-0000-000000000001', 1::smallint, 'hint')
    and public.record_question_move('dddddddd-0000-0000-0000-000000000001', 1::smallint, 'hint')),
  true, 'two presses of Hint are both counted');
select is(
  (select hints from public.question_parts where position = 1),
  2::smallint, 'each press added one hint');

update public.questions set answered_at = now()
where id = 'dddddddd-0000-0000-0000-000000000001';
select is(
  public.record_question_move('dddddddd-0000-0000-0000-000000000001', 1::smallint, 'hint'),
  false, 'a press on an answered Question counts nothing');
update public.questions set answered_at = null
where id = 'dddddddd-0000-0000-0000-000000000001';

select public.record_question_move('dddddddd-0000-0000-0000-000000000001', 1::smallint, 'solution');
select is(
  public.record_question_move('dddddddd-0000-0000-0000-000000000001', 1::smallint, 'hint'),
  false, 'a press on a part with its solution shown counts nothing');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$select 1 from public.question_parts$$,
  'another Student reads none of the parts');

select * from finish();
rollback;
