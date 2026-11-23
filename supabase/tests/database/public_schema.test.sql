-- Schema-wide guards for every table in `public`, so a new table cannot skip
-- them: Row Level Security is on, visitors (anon) hold no privileges, and no
-- plain index repeats the leading columns of another one.
-- Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

select cmp_ok(
  (select count(*)::int from pg_catalog.pg_class
    where relnamespace = 'public'::regnamespace and relkind in ('r', 'p')),
  '>', 0, 'the public schema has tables to check');

select is_empty(
  $$select c.relname from pg_catalog.pg_class as c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity$$,
  'every public table has Row Level Security enabled');

select is_empty(
  $$select c.relname || ': ' || p.privilege_type
    from pg_catalog.pg_class as c
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as p
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and p.grantee = 'anon'::regrole$$,
  'anon has no privileges on any public table');

-- A non-unique index whose columns lead another index of the same kind adds
-- write cost and serves no lookup the other one does not.
select is_empty(
  $$select a.indexrelid::regclass || ' is covered by ' || b.indexrelid::regclass
    from pg_catalog.pg_index as a
    join pg_catalog.pg_class as ac on ac.oid = a.indexrelid
    join pg_catalog.pg_index as b
      on b.indrelid = a.indrelid and b.indexrelid <> a.indexrelid
    join pg_catalog.pg_class as bc on bc.oid = b.indexrelid
    where ac.relnamespace = 'public'::regnamespace
      and not a.indisunique
      and ac.relam = bc.relam
      and a.indexprs is null and b.indexprs is null
      and a.indpred is null and b.indpred is null
      and (b.indkey::text = a.indkey::text
        or b.indkey::text like a.indkey::text || ' %')
      and (a.indexrelid < b.indexrelid or b.indisunique
        or b.indkey::text <> a.indkey::text)$$,
  'no public index repeats the leading columns of another');

select * from finish();
rollback;
