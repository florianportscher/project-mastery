import "server-only";
import { z } from "zod";
import { loadChunkSources } from "@/features/ingestion/server";
import {
  answerKeySchema,
  type AnswerKey,
} from "@/features/knowledge-map/server";
import type { GradedStep } from "@/features/study/domain/mock-grading";
import type { MockTaskGrade } from "@/features/study/types";
import { failed } from "@/lib/supabase/failed";
import type { Supabase } from "@/lib/supabase/types";

/**
 * What a graded Mock exam's page reads besides the mock (#186): each task's grade and reference solution, and the
 * Student's calibration on sure answers.
 */

const stepsSchema = z.array(
  z.object({ points: z.number(), reason: z.string() }),
);

/** A task's grade from its item's columns; null until grading finished. */
export function taskGrade(item: {
  graded_at: string | null;
  points_awarded: number | null;
  steps: unknown;
  check: string | null;
}): MockTaskGrade | null {
  if (item.graded_at === null) return null;
  if (item.points_awarded === null) return { status: "failed" };
  const steps = stepsSchema.safeParse(item.steps);
  return {
    status: "graded",
    pointsAwarded: item.points_awarded,
    steps: steps.success ? (steps.data satisfies GradedStep[]) : [],
    check:
      item.check === "match" ||
      item.check === "mismatch" ||
      item.check === "unchecked"
        ? item.check
        : null,
  };
}

/**
 * The item's reference solution and final answers: its Exercise's printed
 * solution chunk or its Problem's solution.
 */
export async function loadItemSource(
  supabase: Supabase,
  item: { exercise_id: string | null; problem_id: string | null },
): Promise<{ reference: string | null; keys: AnswerKey[] | null }> {
  const keysOf = (value: unknown) => {
    const parsed = z.array(answerKeySchema).safeParse(value);
    return parsed.success ? parsed.data : null;
  };
  if (item.problem_id !== null) {
    const { data, error } = await supabase
      .from("problems")
      .select("solution, final_answers")
      .eq("id", item.problem_id)
      .maybeSingle();
    if (error) failed("Loading the item's Problem", error);
    return {
      reference: data?.solution ?? null,
      keys: keysOf(data?.final_answers),
    };
  }
  if (item.exercise_id === null) return { reference: null, keys: null };
  const [exercise, solutions] = await Promise.all([
    supabase
      .from("exercises")
      .select("final_answers")
      .eq("id", item.exercise_id)
      .maybeSingle(),
    supabase
      .from("exercise_chunks")
      .select("chunk_id")
      .eq("exercise_id", item.exercise_id)
      .eq("role", "solution")
      .order("position"),
  ]);
  if (exercise.error) failed("Loading the item's Exercise", exercise.error);
  if (solutions.error) {
    failed("Loading the item's Exercise's solutions", solutions.error);
  }
  if (!exercise.data) return { reference: null, keys: null };
  // The printed solutions, when the Materials have any.
  const ids = solutions.data.map((row) => row.chunk_id);
  const chunks = await loadChunkSources(supabase, ids);
  const texts = ids.flatMap(
    (id) => chunks.find((chunk) => chunk.id === id)?.markdown ?? [],
  );
  return {
    reference: texts.length > 0 ? texts.join("\n\n") : null,
    keys: keysOf(exercise.data.final_answers),
  };
}

/**
 * The Course's graded questions the Student answered with confidence 4,
 * and how many were right: every attempt `full`. Null without one.
 */
export async function loadSureAnswers(
  supabase: Supabase,
  courseId: string,
): Promise<{ right: number; total: number } | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, attempts(result), study_sessions!inner(course_id)")
    .eq("study_sessions.course_id", courseId)
    .eq("confidence", 4)
    .not("graded_at", "is", null);
  if (error) failed("Loading the sure answers", error);
  const graded = data.filter((question) => question.attempts.length > 0);
  if (graded.length === 0) return null;
  return {
    right: graded.filter((question) =>
      question.attempts.every(({ result }) => result === "full"),
    ).length,
    total: graded.length,
  };
}
