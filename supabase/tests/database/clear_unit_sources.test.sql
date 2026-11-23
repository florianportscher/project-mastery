-- A unit extracted again (#375): `clear_unit_sources` deletes the sources on
-- its chunks and retires the KCs left without one, while the build runs.
-- Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email)
values ('11111111-1111-1111-1111-111111111111', 'alice@example.com');
insert into public.courses (id, owner, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Algebra');
insert into public.materials (id, owner, course_id, name, media_type, size_bytes, storage_path, parse_status)
values ('aaaaaaaa-1111-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-0000-0000-0000-000000000001', 'Script', 'application/pdf', 1000,
  '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001/aaaaaaaa-1111-0000-0000-000000000001',
  'parsed');
select public.replace_material_chunks('aaaaaaaa-1111-0000-0000-000000000001',
  '[{"position": 0, "page_from": 1, "page_to": 1, "label": "content", "markdown": "Bases.", "heading": "Bases"},
    {"position": 1, "page_from": 2, "page_to": 2, "label": "content", "markdown": "Ranks.", "heading": "Ranks"}]');

insert into public.kcs (id, owner, course_id, name, description, origin, position)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Basis', 'Only in the unit.', 'content', 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001', 'Rank', 'Also elsewhere.', 'content', 1);
insert into public.kc_sources (kc_id, chunk_id, owner, course_id)
select k.id, c.id, c.owner, c.course_id
from public.chunks as c
join public.kcs as k
  on k.course_id = c.course_id
  and (c.markdown = 'Bases.' or (k.name = 'Rank' and c.markdown = 'Ranks.'))
where c.course_id = 'aaaaaaaa-0000-0000-0000-000000000001';

select is(
  public.clear_unit_sources('aaaaaaaa-0000-0000-0000-000000000001',
    array(select id from public.chunks where markdown = 'Bases.')),
  false,
  'nothing is cleared while no build runs');

insert into public.knowledge_map_builds (course_id, owner, status)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'building');

select is(
  public.clear_unit_sources('aaaaaaaa-0000-0000-0000-000000000001',
    array(select id from public.chunks where markdown = 'Bases.')),
  true,
  'clears while the build runs');
select results_eq(
  $$select k.name, k.retired_at is null, count(s.chunk_id)::integer
    from public.kcs as k left join public.kc_sources as s on s.kc_id = k.id
    where k.course_id = 'aaaaaaaa-0000-0000-0000-000000000001'
    group by k.name, k.retired_at order by k.name$$,
  $$values ('Basis'::text, false, 0), ('Rank'::text, true, 1)$$,
  'a KC sourced only on the unit retires, one sourced elsewhere keeps that source');

select * from finish();
rollback;
