-- A Chat's session gets the length the Student chose (#302):
-- `set_session_minutes` accepts 15, 30 or 45 for the caller's own running
-- session, once and only while it has no Question. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

insert into public.courses (id, owner, name)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Jet engines'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Biology');

-- Each new Chat starts its session.
insert into public.chats (id, owner, course_id)
values
  ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000003');

insert into public.questions (owner, session_id, prompt)
select owner, id, 'Why?' from public.study_sessions
where chat_id = 'cccccccc-0000-0000-0000-000000000002';

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(public.set_session_minutes('cccccccc-0000-0000-0000-000000000001', 20),
  false, 'a length other than 15, 30 or 45 is refused');
select is(public.set_session_minutes('cccccccc-0000-0000-0000-000000000002', 30),
  false, 'a session with a Question is refused');
select is(public.set_session_minutes('cccccccc-0000-0000-0000-000000000003', 30),
  false, 'another Student''s session is refused');
select is(public.set_session_minutes('cccccccc-0000-0000-0000-000000000001', 15),
  true, 'the owner''s new session gets its length');
select is(public.set_session_minutes('cccccccc-0000-0000-0000-000000000001', 45),
  false, 'a session that has a length keeps it');

reset role;

select results_eq(
  $$select chat_id, planned_minutes from public.study_sessions
    where chat_id::text like 'cccccccc-0000-0000-0000-00000000000_' order by chat_id$$,
  $$values ('cccccccc-0000-0000-0000-000000000001'::uuid, 15),
    ('cccccccc-0000-0000-0000-000000000002'::uuid, null::integer),
    ('cccccccc-0000-0000-0000-000000000003'::uuid, null::integer)$$,
  'only the new session of the owner has its length');

select throws_ok(
  $$update public.study_sessions set planned_minutes = 20$$,
  '23514',
  null,
  'the table accepts no other length');

select * from finish();
rollback;
