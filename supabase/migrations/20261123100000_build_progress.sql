-- How far the running build has got, for the Course map's build panel
-- (#368). The owner-read policy on knowledge_map_builds covers the column.

alter table public.knowledge_map_builds
  add column progress jsonb;

comment on column public.knowledge_map_builds.progress is 'How far the build has got: { stage, done?, total?, waitUntil? }. stage is materials, exercises, connecting, topics or finishing; done of total units of the stage; waitUntil while the rate limit pauses the build. Null when a build (re)starts. Written by the build steps.';

-- As before, but (re)starting a build clears its progress.
create or replace function public.queue_knowledge_map_build(course_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with stopped as (
    update public.materials as m
    set parse_status = 'failed', parse_failure = 'The parse stopped. Parse again.'
    where m.course_id = queue_knowledge_map_build.course_id
      and m.owner = (select auth.uid())
      and m.parse_status in ('queued', 'parsing')
      and m.heartbeat_at < now() - interval '30 minutes'
    returning m.id
  ),
  course as (
    select c.id, c.owner
    from public.courses as c
    where c.id = queue_knowledge_map_build.course_id
      and c.owner = (select auth.uid())
      and exists (
        select 1 from public.materials as m
        where m.course_id = c.id and m.parse_status = 'parsed'
      )
      and not exists (
        select 1 from public.materials as m
        where m.course_id = c.id
          and m.parse_status in ('queued', 'parsing')
          and m.id not in (select id from stopped)
      )
  ),
  queued as (
    insert into public.knowledge_map_builds as b (course_id, owner, status)
    select id, owner, 'building' from course
    on conflict (course_id) do update
    set status = 'building', failure_reason = null, started_at = now(),
      heartbeat_at = now(), progress = null
    where b.status <> 'building'
      or b.heartbeat_at < now() - interval '30 minutes'
    returning b.course_id
  )
  select exists (select 1 from queued);
$$;
