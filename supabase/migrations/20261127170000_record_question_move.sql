-- Counts a press of Hint or Show the solution (#449) in one statement, so
-- two presses count two hints, and a press that lands after the Question was
-- answered or graded, or the part's solution was shown, counts nothing.
-- True when the press was counted. Runs as the caller: row level security
-- applies.
create function public.record_question_move(
  p_question_id uuid,
  p_position smallint,
  p_kind text
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with counted as (
    update public.question_parts as part
    set hints = case when p_kind = 'hint' then part.hints + 1 else part.hints end,
        solution_shown_at = case
          when p_kind = 'solution' then now() else part.solution_shown_at
        end
    from public.questions as question
    where part.question_id = p_question_id
      and part.position = p_position
      and p_kind in ('hint', 'solution')
      and part.solution_shown_at is null
      and question.id = part.question_id
      and question.answered_at is null
      and question.graded_at is null
    returning 1
  )
  select exists (select 1 from counted);
$$;

revoke all on function public.record_question_move(uuid, smallint, text) from public, anon;
grant execute on function public.record_question_move(uuid, smallint, text) to authenticated;
