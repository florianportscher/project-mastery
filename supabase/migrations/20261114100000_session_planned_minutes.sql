-- A Study session has a length the Student chose (#302): null for Open,
-- otherwise 15, 30 or 45 minutes. The tutor context and the strip read it.

alter table public.study_sessions
  add column planned_minutes integer
  check (planned_minutes in (15, 30, 45));

comment on column public.study_sessions.planned_minutes is
  'The length the Student chose on the Today card, in minutes: 15, 30 or 45; null for an Open session.';

create function public.set_session_minutes(p_chat_id uuid, p_minutes integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.study_sessions s
  set planned_minutes = p_minutes
  where s.chat_id = p_chat_id
    and s.owner = (select auth.uid())
    and s.planned_minutes is null
    and s.ended_at is null
    and p_minutes in (15, 30, 45)
    and not exists (
      select 1 from public.questions q where q.session_id = s.id
    );
  return found;
end;
$$;

comment on function public.set_session_minutes(uuid, integer) is
  'Sets the caller''s running Chat session''s length to 15, 30 or 45 minutes, while it has none and no Question; false otherwise.';

revoke execute on function public.set_session_minutes(uuid, integer) from public, anon;
grant execute on function public.set_session_minutes(uuid, integer) to authenticated;
