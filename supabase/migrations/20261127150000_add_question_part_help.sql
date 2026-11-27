-- Hint and Show the solution (#449): how much help each part of a Question
-- got, counted when the Student presses the buttons. `grade` reads them to
-- set each KC's Attempt help.

alter table public.question_parts
  add column hints smallint not null default 0 check (hints >= 0),
  add column solution_shown_at timestamptz;

grant update (hints, solution_shown_at)
  on table public.question_parts to authenticated;

-- The press a Student message sends: { kind, questionId, position, draft },
-- which the Chat shows as a small bubble. Null for any other message.
alter table public.chat_messages add column move jsonb check (
  move is null or jsonb_typeof(move) = 'object'
);
