-- Send to developer (#384): a developer inserts and reads their own flags;
-- anyone else can neither insert nor read. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');
insert into public.developers (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.courses (id, owner, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Algebra');
-- A row of a non-developer, as the secret key could write it.
insert into public.developer_flags (owner, course_id, note)
values ('22222222-2222-2222-2222-222222222222', null, 'bob');

select policies_are(
  'public',
  'developer_flags',
  array['Developers can read their own flags', 'Developers can add their own flags'],
  'developer_flags has exactly the expected policies'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select lives_ok(
  $$insert into public.developer_flags (owner, course_id, note)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'felt wrong')$$,
  'a developer inserts their own flag'
);
select results_eq(
  $$select note from public.developer_flags$$,
  $$values ('felt wrong')$$,
  'a developer reads only their own flags'
);
select throws_ok(
  $$insert into public.developer_flags (owner, note)
    values ('22222222-2222-2222-2222-222222222222', 'for bob')$$,
  '42501', null, 'a developer cannot flag for someone else'
);
select throws_ok(
  $$insert into public.developer_flags (owner, note)
    values ('11111111-1111-1111-1111-111111111111', repeat('x', 1001))$$,
  '23514', null, 'a note is at most 1,000 characters'
);

select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);

select throws_ok(
  $$insert into public.developer_flags (owner, note)
    values ('22222222-2222-2222-2222-222222222222', 'mine')$$,
  '42501', null, 'a non-developer cannot insert'
);
select is_empty(
  $$select 1 from public.developer_flags$$,
  'a non-developer reads no flags'
);

select * from finish();
rollback;
