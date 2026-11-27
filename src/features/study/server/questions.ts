import "server-only";
import { z } from "zod";
import { answerKeySchema } from "@/features/knowledge-map/server";
import type {
  FinalValueCheck,
  QuestionToGrade,
} from "@/features/study/ai/tools";
import type {
  AttemptHelp,
  AttemptResult,
} from "@/features/study/domain/replay";
import type { GradedPart, PartAnswer, PartForm } from "@/features/study/types";
import { failed } from "@/lib/supabase/failed";
import type { Supabase } from "@/lib/supabase/types";

/**
 * Questions the AI asks in a Chat's Study session, the Student's answers in
 * the Chat, and the attempts their grading stores (ADR 0018).
 */

export type TutorSession = {
  id: string;
  startedAt: string;
  /** The graded Mock exam it goes through; null for none. */
  mockId: string | null;
  /** The length the Student chose; null for Open. */
  plannedMinutes: number | null;
};

export async function loadTutorSession(
  supabase: Supabase,
  chatId: string,
): Promise<TutorSession | null> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, started_at, mock_id, planned_minutes")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) failed("Loading the Study session", error);
  return (
    data && {
      id: data.id,
      startedAt: data.started_at,
      mockId: data.mock_id,
      plannedMinutes: data.planned_minutes,
    }
  );
}

export async function loadSessionQuestions(
  supabase: Supabase,
  sessionId: string,
): Promise<
  Array<{
    prompt: string;
    kcIds: string[];
    parts: Array<{
      position: number;
      prompt: string;
      hints: number;
      solutionShown: boolean;
    }>;
    answered: boolean;
    gradedAt: string | null;
  }>
> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      "prompt, answered_at, graded_at, question_kcs(kc_id), question_parts(position, prompt, hints, solution_shown_at)",
    )
    .eq("session_id", sessionId)
    .order("asked_at")
    .order("id");
  if (error) failed("Loading the session's Questions", error);
  return data.map((row) => ({
    prompt: row.prompt,
    kcIds: row.question_kcs.map(({ kc_id }) => kc_id),
    parts: row.question_parts
      .toSorted((a, b) => a.position - b.position)
      .map(({ position, prompt, hints, solution_shown_at }) => ({
        position,
        prompt,
        hints,
        solutionShown: solution_shown_at !== null,
      })),
    answered: row.answered_at !== null,
    gradedAt: row.graded_at,
  }));
}

/**
 * Stores a Question with its parts, positions from 1 in order, and the KCs
 * they test.
 */
export async function insertQuestion(
  supabase: Supabase,
  question: {
    sessionId: string;
    prompt: string;
    parts: Array<{
      prompt: string;
      kcId: string;
      form: PartForm;
      options: string[] | null;
    }>;
    exerciseId: string | null;
    /** The generated Problem it poses, or null; never with an Exercise. */
    problemId: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("questions")
    .insert({
      session_id: question.sessionId,
      prompt: question.prompt,
      exercise_id: question.exerciseId,
      problem_id: question.problemId,
    })
    .select("id")
    .single();
  if (error) failed("Saving the question", error);
  const { error: kcsError } = await supabase.from("question_kcs").insert(
    [...new Set(question.parts.map(({ kcId }) => kcId))].map((kcId) => ({
      question_id: data.id,
      kc_id: kcId,
    })),
  );
  if (kcsError) failed("Saving the question's KCs", kcsError);
  const { error: partsError } = await supabase.from("question_parts").insert(
    question.parts.map((part, index) => ({
      question_id: data.id,
      position: index + 1,
      prompt: part.prompt,
      kc_id: part.kcId,
      form: part.form,
      options: part.options,
    })),
  );
  if (partsError) failed("Saving the question's parts", partsError);
  return data.id;
}

/**
 * The session's newest Question, as `ask` and `grade` check it, but for
 * whether the session has ended and which of its KCs are live: `kcIds` holds
 * all it tests. Null without one.
 */
export async function findNewestQuestion(
  supabase: Supabase,
  sessionId: string,
): Promise<Omit<QuestionToGrade, "sessionEnded" | "retiredKcIds"> | null> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, answered_at, graded_at, question_kcs(kc_id), question_parts(position, kc_id, hints, solution_shown_at), exercises(final_answers), problems(final_answers)",
    )
    .eq("session_id", sessionId)
    .order("asked_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) failed("Loading the question", error);
  if (!data) return null;
  // The key of the Exercise or generated Problem it poses. A key that no
  // longer parses is no key: the check then doesn't apply.
  const finalAnswers = z
    .array(answerKeySchema)
    .safeParse(
      data.exercises?.final_answers ?? data.problems?.final_answers ?? null,
    );
  return {
    id: data.id,
    kcIds: data.question_kcs.map(({ kc_id }) => kc_id),
    parts: data.question_parts
      .map(({ position, kc_id, hints, solution_shown_at }) => ({
        position,
        kcId: kc_id,
        hints,
        solutionShown: solution_shown_at !== null,
      }))
      .toSorted((a, b) => a.position - b.position),
    answered: data.answered_at !== null,
    graded: data.graded_at !== null,
    finalAnswers: finalAnswers.success ? finalAnswers.data : null,
  };
}

/**
 * Marks an answered, ungraded question graded, stores each part's result
 * and note, and one attempt per KC of `results`. False when it was graded
 * in the meantime, storing nothing.
 */
export async function saveAttempts(
  supabase: Supabase,
  grade: {
    questionId: string;
    sessionId: string;
    parts: GradedPart[];
    results: Array<{ kcId: string; result: AttemptResult; help: AttemptHelp }>;
    /** The worst answer check, stored on every attempt; null without keys. */
    check: FinalValueCheck;
  },
): Promise<boolean> {
  // Claimed first, so a concurrent grade of the same question stores nothing.
  const { data: claimed, error } = await supabase
    .from("questions")
    .update({ graded_at: new Date().toISOString() })
    .eq("id", grade.questionId)
    .is("graded_at", null)
    .not("answered_at", "is", null)
    .select("id");
  if (error) failed("Grading the question", error);
  if (claimed.length === 0) return false;

  const unclaim = () =>
    supabase
      .from("questions")
      .update({ graded_at: null })
      .eq("id", grade.questionId);
  const partErrors = await Promise.all(
    grade.parts.map(async ({ position, result, note }) => {
      const { error } = await supabase
        .from("question_parts")
        .update({ result, note })
        .eq("question_id", grade.questionId)
        .eq("position", position);
      return error;
    }),
  );
  const partError = partErrors.find((e) => e !== null);
  if (partError) {
    await unclaim();
    failed("Saving the parts' grades", partError);
  }
  if (grade.results.length === 0) return true;
  const { error: attemptsError } = await supabase.from("attempts").insert(
    grade.results.map(({ kcId, result, help }) => ({
      question_id: grade.questionId,
      session_id: grade.sessionId,
      kc_id: kcId,
      result,
      help,
      check: grade.check,
    })),
  );
  if (attemptsError) {
    await unclaim();
    failed("Saving the attempts", attemptsError);
  }
  return true;
}

/**
 * Marks an ungraded question graded without attempts, as `grade` does when
 * the Student moved on. False when it was graded in the meantime.
 */
export async function closeQuestion(
  supabase: Supabase,
  questionId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("questions")
    .update({ graded_at: new Date().toISOString() })
    .eq("id", questionId)
    .is("graded_at", null)
    .select("id");
  if (error) failed("Closing the question", error);
  return data.length > 0;
}

/** The newest Question of the Chat's session, with its parts; null for none. */
async function newestChatQuestion(supabase: Supabase, chatId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, answered_at, graded_at, question_parts(position, options, hints, solution_shown_at), study_sessions!inner(chat_id)",
    )
    .eq("study_sessions.chat_id", chatId)
    .order("asked_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) failed("Loading the open question", error);
  return data;
}

/**
 * Stores `answer` as the answer to the open Question: the newest Question
 * of the Chat's session, while it is unanswered and ungraded. Nothing is
 * stored otherwise.
 */
async function storeAnswer(
  supabase: Supabase,
  questionId: string,
  answer: { messageId: string; text: string },
): Promise<boolean> {
  const { data, error } = await supabase
    .from("questions")
    .update({
      answer_text: answer.text || null,
      answer_message_id: answer.messageId,
      answered_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .is("answered_at", null)
    .is("graded_at", null)
    .select("id");
  if (error) failed("Saving the answer", error);
  return data.length > 0;
}

/**
 * Records the Student's Chat message `messageId` that sends a photo, or
 * another attached Material, as the answer to the whole open Question.
 * Nothing is stored when there is no open, unanswered Question.
 */
export async function recordAnswer(
  supabase: Supabase,
  chatId: string,
  answer: { messageId: string; text: string },
): Promise<void> {
  const newest = await newestChatQuestion(supabase, chatId);
  if (!newest || newest.answered_at !== null || newest.graded_at !== null) {
    return;
  }
  await storeAnswer(supabase, newest.id, answer);
}

export const answerRefusedMessage =
  "This question is no longer open, so its answer can't be sent.";

/**
 * Why a Submit of `answer` is refused, or null when it may be stored: it
 * must answer the newest Question of the Chat's session, unanswered and
 * ungraded, with one answer for each of its parts.
 */
export async function submitRefusal(
  supabase: Supabase,
  chatId: string,
  answer: { questionId: string; parts: PartAnswer[] },
): Promise<string | null> {
  const newest = await newestChatQuestion(supabase, chatId);
  if (
    !newest ||
    newest.id !== answer.questionId ||
    newest.answered_at !== null ||
    newest.graded_at !== null
  ) {
    return answerRefusedMessage;
  }
  const expected = newest.question_parts.map(({ position }) => position);
  const given = answer.parts.map(({ position }) => position);
  if (
    expected.length === 0 ||
    new Set(given).size !== given.length ||
    given.length !== expected.length ||
    given.some((position) => !expected.includes(position))
  ) {
    return "This answer doesn't match the question's parts.";
  }
  // A choice must be one of the part's options; no other part has one.
  const options = new Map(
    newest.question_parts.map((part) => [part.position, part.options]),
  );
  const badChoice = answer.parts.some(({ position, choice }) => {
    const count = options.get(position)?.length ?? 0;
    return choice !== null && choice >= count;
  });
  if (badChoice) return "This answer doesn't match the question's parts.";
  return null;
}

export const moveRefusedMessage =
  "This part's help can't be given now: the question is no longer open, or the solution of the part is shown.";

/**
 * Why a press of Hint or Show the solution is refused, or null when it may
 * be stored: it must be on a part of the newest Question of the Chat's
 * session, unanswered and ungraded, whose solution is not shown.
 */
export async function moveRefusal(
  supabase: Supabase,
  chatId: string,
  move: { questionId: string; position: number },
): Promise<string | null> {
  const newest = await newestChatQuestion(supabase, chatId);
  const part = newest?.question_parts.find(
    ({ position }) => position === move.position,
  );
  if (
    !newest ||
    newest.id !== move.questionId ||
    newest.answered_at !== null ||
    newest.graded_at !== null ||
    !part ||
    part.solution_shown_at !== null
  ) {
    return moveRefusedMessage;
  }
  return null;
}

/**
 * Counts a press on its part: one more hint, or the solution shown, set
 * once. Refusals are checked by `moveRefusal` before.
 */
export async function recordMove(
  supabase: Supabase,
  chatId: string,
  move: { kind: "hint" | "solution"; questionId: string; position: number },
): Promise<void> {
  const newest = await newestChatQuestion(supabase, chatId);
  const part = newest?.question_parts.find(
    ({ position }) => position === move.position,
  );
  if (!newest || newest.id !== move.questionId || !part) return;
  const { error } = await supabase
    .from("question_parts")
    .update(
      move.kind === "hint"
        ? { hints: part.hints + 1 }
        : { solution_shown_at: new Date().toISOString() },
    )
    .eq("question_id", move.questionId)
    .eq("position", move.position);
  if (error) failed("Saving the press", error);
}

/**
 * Stores a Submit: the Question's answer, as the message `messageId` and its
 * text, and each part's answer, an empty field as null. False, storing
 * nothing, when the Question was answered or graded in the meantime.
 */
export async function submitAnswer(
  supabase: Supabase,
  answer: {
    questionId: string;
    messageId: string;
    text: string;
    parts: PartAnswer[];
  },
): Promise<boolean> {
  if (!(await storeAnswer(supabase, answer.questionId, answer))) return false;
  const errors = await Promise.all(
    answer.parts.map(async ({ position, text, choice }) => {
      const { error } = await supabase
        .from("question_parts")
        .update({ answer_text: text.trim() === "" ? null : text, choice })
        .eq("question_id", answer.questionId)
        .eq("position", position);
      return error;
    }),
  );
  const error = errors.find((e) => e !== null);
  if (error) failed("Saving the answers to the parts", error);
  return true;
}
