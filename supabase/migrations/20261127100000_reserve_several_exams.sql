-- Reserve several exams (#412): the Reserved exam becomes a flag on each old
-- exam, so a Student keeps any number unseen and each becomes a final mock.
-- Existing reservations carry over.

alter table public.exams
  add column reserved boolean not null default false,
  add constraint exams_reserved_confirmed check (not reserved or confirmed is true);

comment on column public.exams.reserved is 'Whether the Student keeps the old exam unseen for a final Mock exam; only a confirmed exam can be reserved.';

update public.exams e
set reserved = true
from public.briefs b
where b.reserved_exam_id = e.id
  and e.confirmed is true;

grant update (reserved) on table public.exams to authenticated;

drop trigger briefs_check_reserved_exam on public.briefs;
drop function private.check_reserved_exam();
drop index public.briefs_reserved_exam_id_idx;
alter table public.briefs drop column reserved_exam_id;

-- save_brief ------------------------------------------------------------------------

drop function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text);

-- As before (20261121110000), plus:
-- - `reserved_exam_ids`, unless null, replaces the Course's reserved exams;
--   only confirmed exams are reserved. An exam that is no longer confirmed
--   loses its reservation, and when that drops the last one, the Brief asks
--   again.
create function public.save_brief(
  course_id uuid,
  fields jsonb default '{}',
  excluded_material_ids uuid[] default null,
  exam_ids uuid[] default null,
  asked_exam_ids uuid[] default null,
  course_language text default null,
  reserved_exam_ids uuid[] default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  had_reserved boolean;
begin
  perform 1 from public.briefs b
  where b.course_id = save_brief.course_id
  for update;
  if not found then
    return false;
  end if;

  if exam_ids is not null then
    select exists (
      select 1 from public.exams e
      where e.course_id = save_brief.course_id and e.reserved
    ) into had_reserved;

    update public.exams e
    set
      confirmed = case
        when e.id = any (exam_ids) then true
        when e.confirmed is true or e.id = any (coalesce(asked_exam_ids, '{}')) then false
        else e.confirmed
      end,
      reserved = e.reserved and e.id = any (exam_ids),
      asked = e.asked or e.id = any (coalesce(asked_exam_ids, '{}'))
    where e.course_id = save_brief.course_id;

    if had_reserved and not exists (
      select 1 from public.exams e
      where e.course_id = save_brief.course_id and e.reserved
    ) then
      update public.briefs b
      set reserved_exam_answered = false
      where b.course_id = save_brief.course_id;
    end if;
  end if;

  update public.briefs b
  set
    exam_date = case when fields ? 'exam_date' then (fields ->> 'exam_date')::date else b.exam_date end,
    goal = case when fields ? 'goal' then fields ->> 'goal' else b.goal end,
    open_book = case when fields ? 'open_book' then (fields ->> 'open_book')::boolean else b.open_book end,
    formula_sheet = case when fields ? 'formula_sheet' then (fields ->> 'formula_sheet')::boolean else b.formula_sheet end,
    calculator = case when fields ? 'calculator' then (fields ->> 'calculator')::boolean else b.calculator end,
    scope_confirmed = case when fields ? 'scope_confirmed' then (fields ->> 'scope_confirmed')::boolean else b.scope_confirmed end,
    reserved_exam_answered = case when fields ? 'reserved_exam_answered' then (fields ->> 'reserved_exam_answered')::boolean else b.reserved_exam_answered end
  where b.course_id = save_brief.course_id;

  if reserved_exam_ids is not null then
    update public.exams e
    set reserved = e.confirmed is true and e.id = any (reserved_exam_ids)
    where e.course_id = save_brief.course_id;
  end if;

  if excluded_material_ids is not null then
    delete from public.brief_excluded_materials e
    where e.course_id = save_brief.course_id;
    insert into public.brief_excluded_materials (course_id, material_id)
    select distinct save_brief.course_id, m.id
    from unnest(excluded_material_ids) as m (id);
  end if;

  if course_language is not null then
    update public.courses c
    set language = course_language
    where c.id = save_brief.course_id;
  end if;
  return true;
end;
$$;

comment on function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text, uuid[]) is 'Changes the given fields and, unless null, the excluded Materials, the confirmed old exams, the Course language and the reserved exams of the caller''s Brief, marking the listed exams asked, all or nothing; false without a Brief.';

revoke execute on function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text, uuid[]) from public, anon;
grant execute on function public.save_brief(uuid, jsonb, uuid[], uuid[], uuid[], text, uuid[]) to authenticated;
