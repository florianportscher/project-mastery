-- Send to developer (#384): a developer marks a Chat or a Course's map build
-- that went wrong, with a short note. `pnpm archive flagged` later archives
-- each flag as a case and sets `case_id`.

create table public.developer_flags (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  -- Kept as null when the Course or Chat is deleted, so the archive can
  -- report the flag as lost.
  course_id uuid references public.courses (id) on delete set null,
  -- Null for a map build.
  chat_id uuid references public.chats (id) on delete set null,
  note text not null default '' check (char_length(note) <= 1000),
  -- A map build flag: the build it was sent for, so a later rebuild is never
  -- archived under an old note.
  app_commit text,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  case_id text
);

comment on table public.developer_flags is 'A Chat or map build a developer sent to the developer with a note. Written outside production only; archived by `pnpm archive flagged`, which sets case_id.';
comment on column public.developer_flags.chat_id is 'The flagged Chat; null when the flag is for the Course''s map build.';
comment on column public.developer_flags.case_id is 'The case the flag was archived as; null until archived.';

create index developer_flags_owner_idx on public.developer_flags (owner);

alter table public.developer_flags enable row level security;

create policy "Developers can read their own flags"
on public.developer_flags for select to authenticated
using (
  (select auth.uid()) = owner
  and exists (
    select 1 from public.developers d where d.user_id = (select auth.uid())
  )
);

create policy "Developers can add their own flags"
on public.developer_flags for insert to authenticated
with check (
  (select auth.uid()) = owner
  and case_id is null
  and exists (
    select 1 from public.developers d where d.user_id = (select auth.uid())
  )
);

revoke all on table public.developer_flags from anon, authenticated;
grant select, insert on table public.developer_flags to authenticated;

-- The read-only staging role (ADR 0025) exists on staging only.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'agent_reader') then
    grant select on table public.developer_flags to agent_reader;
  end if;
end
$$;
