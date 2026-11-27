-- Answer forms (#448): a Question becomes a task in parts. Each part has
-- its own field in the Question card, the Student submits all parts at
-- once, and `grade` stores a result and a note per part (ADR 0018). A
-- Question without parts (Mock exams, earlier Chat Questions) stays as it
-- is: no backfill.

create table public.question_parts (
  question_id uuid not null references public.questions (id) on delete cascade,
  -- 1 to 6, in the order the card shows them.
  position smallint not null check (position between 1 and 6),
  owner uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Markdown with LaTeX.
  prompt text not null check (char_length(prompt) between 1 and 2000),
  -- The KC it tests; null once that KC is deleted, so the part still shows.
  kc_id uuid references public.kcs (id) on delete set null,
  form text not null check (form in ('short', 'long', 'choice')),
  -- The 2 to 4 options of a choice part; null for any other form.
  options text[] check (options is null or cardinality(options) between 2 and 4),
  -- The Student's submitted answer: the text of the field, and for a choice
  -- part the index of the chosen option. Both null when left empty.
  answer_text text check (char_length(answer_text) <= 5000),
  choice smallint,
  -- Null until graded.
  result text check (result in ('full', 'partial', 'wrong', 'unanswered')),
  note text check (char_length(note) <= 300),
  primary key (question_id, position),
  check ((form = 'choice') = (options is not null)),
  check (choice is null or choice between 0 and cardinality(options) - 1)
);

comment on table public.question_parts is 'A part of a Question: its prompt, KC and answer form, the Student''s answer to it and its grade.';

create index question_parts_owner_idx on public.question_parts (owner);
create index question_parts_kc_id_idx on public.question_parts (kc_id);

alter table public.question_parts enable row level security;

create policy "Students can read their own question parts"
on public.question_parts for select to authenticated
using ((select auth.uid()) = owner);

-- Only on the Student's own Question, on a KC that Question tests.
create policy "Students can add parts to their own questions"
on public.question_parts for insert to authenticated
with check (
  (select auth.uid()) = owner
  and exists (
    select 1
    from public.questions
    join public.question_kcs on question_kcs.question_id = questions.id
    where questions.id = question_parts.question_id
      and questions.owner = (select auth.uid())
      and question_kcs.kc_id = question_parts.kc_id
  )
);

create policy "Students can answer and grade their own question parts"
on public.question_parts for update to authenticated
using ((select auth.uid()) = owner)
with check ((select auth.uid()) = owner);

-- What is asked never changes; only the answer and the grade are filled in.
revoke all on table public.question_parts from anon, authenticated;
grant select on table public.question_parts to authenticated;
grant insert (question_id, position, prompt, kc_id, form, options)
  on table public.question_parts to authenticated;
grant update (answer_text, choice, result, note)
  on table public.question_parts to authenticated;

-- The answer a Student message submits, which the Chat shows in the
-- Question card in place of a message: { questionId, parts }. Null for any
-- other message.
alter table public.chat_messages add column answer jsonb check (
  answer is null or jsonb_typeof(answer) = 'object'
);
