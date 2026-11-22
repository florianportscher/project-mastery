import "server-only";
import {
  exerciseExtractionMessages,
  exerciseExtractionSchema,
  exerciseExtractionSettings,
  type OfferedExerciseUnit,
} from "@/features/knowledge-map/ai/exercise-extraction";
import {
  checkExerciseAnswer,
  type OfferedExercise,
} from "@/features/knowledge-map/domain/exercise-extraction";
import {
  storedExtractionSchema,
  type StoredExtraction,
} from "@/features/knowledge-map/schemas";
import {
  extractAttempts,
  loadCourseLanguageName,
  loadCourseUnits,
  loadStoredUnits,
  planAttempts,
  touchBuild,
  unitKey,
  UNITS_PER_STEP,
  type CourseUnit,
  type StepOutcome,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  buildCall,
  RateLimited,
} from "@/features/knowledge-map/workflows/build-call";
import { storePendingExtractions } from "@/features/knowledge-map/workflows/consolidate-steps";
import { loadKnownKcs } from "@/features/knowledge-map/workflows/extract-steps";
import {
  dailyLimitReason,
  RATE_LIMITED_STEP_RETRIES,
} from "@/features/usage/server";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The exercise steps of a build: one call (task `exercise`) per exercise
 * batch (`exercise-batches.ts`), with its Exercises' whole statements and
 * solutions and every live KC of the Course. Batches run one after another
 * in Course order, and each extraction is stored in `unit_extractions`
 * and then as KCs and Exercises before the next batch's call, so the KCs
 * one proposed are listed for the next. A batch is called again when its
 * Exercises' chunks changed.
 */

/**
 * Extracts up to UNITS_PER_STEP exercise units that need it, one after
 * another in Course order. A unit whose call fails is left to the next step
 * and goes last; after its second failure it is called in pieces until it
 * is given up (`domain/unit-pieces.ts`), so it never fails the build. A
 * unit the rate limit turned away is left to the next step, after the wait
 * (`waitMs`), and goes after the others. A reached Daily limit stops the
 * build; what is stored stays.
 */
export async function extractExercises(
  courseId: string,
  failed: readonly string[] = [],
  deferred: readonly string[] = [],
): Promise<StepOutcome> {
  "use step";
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId);
  if (!owner) return { ok: true, left: null };

  const [units, stored] = await Promise.all([
    loadCourseUnits(supabase, courseId, "exercise"),
    loadStoredUnits(supabase, courseId),
  ]);
  // A batch's hash covers its Exercises' question and solution chunks.
  const current = new Set(
    stored
      .filter((row) => storedExtractionSchema.parse(row.output).exercises)
      .map((row) => `${row.key} ${row.contentHash}`),
  );
  const todo = units.filter(
    (unit) => !current.has(`${unitKey(unit)} ${unit.contentHash}`),
  );
  const attempts = planAttempts(todo, stored, failed, deferred);
  if (attempts.length === 0) return { ok: true, left: 0 };

  // A complete extraction is stored as KCs and Exercises at once; a partial
  // one waits until its unit is complete or given up.
  const complete = new Map(
    units.map((unit) => [unitKey(unit), unit.contentHash]),
  );
  const storeComplete = () =>
    storePendingExtractions(
      supabase,
      owner,
      courseId,
      (row) => complete.get(row.key) === row.contentHash,
    );
  const language = await loadCourseLanguageName(supabase, courseId);
  let done = 0;
  const failedKeys: string[] = [];
  for (const attempt of attempts.slice(0, UNITS_PER_STEP)) {
    if (!callFits(startedAt, BUILD_CALL_TIMEOUT_MS)) break;
    const known = await loadKnownKcs(supabase, courseId);
    const outcome = await extractAttempts(
      supabase,
      { owner, courseId },
      [attempt],
      (unit, chunks) =>
        extractUnit(supabase, owner, {
          courseId,
          unit,
          exerciseIds: chunks.map((chunk) => chunk.id),
          language,
          known,
        }),
      startedAt,
    );
    if (outcome.limit) return { ok: false, reason: dailyLimitReason };
    failedKeys.push(...outcome.failedKeys);
    done += outcome.done;
    if (outcome.done > 0) {
      const after = await storeComplete();
      if (after === "limit") return { ok: false, reason: dailyLimitReason };
      if (after === "stopped") return { ok: true, left: null };
    }
    if (outcome.waitMs !== undefined) {
      return {
        ok: true,
        left: attempts.length - done,
        failed: failedKeys,
        deferred: outcome.done > 0 ? [] : [unitKey(attempt.unit)],
        waitMs: outcome.waitMs,
      };
    }
  }
  return { ok: true, left: attempts.length - done, failed: failedKeys };
}

extractExercises.maxRetries = RATE_LIMITED_STEP_RETRIES;

/**
 * The call over these Exercises of an exercise batch (all of them, or a
 * piece), checked; "limit" when the Daily limit is reached.
 */
async function extractUnit(
  supabase: AdminSupabase,
  owner: string,
  {
    courseId,
    unit,
    exerciseIds,
    language,
    known,
  }: {
    courseId: string;
    unit: CourseUnit;
    exerciseIds: readonly string[];
    language: string;
    known: Awaited<ReturnType<typeof loadKnownKcs>>;
  },
): Promise<StoredExtraction | "limit" | "failed" | RateLimited> {
  const batch = (unit.exercises ?? []).filter((exercise) =>
    exerciseIds.includes(exercise.id),
  );
  const exercises = batch.map((exercise, index): OfferedExercise => ({
    id: `x${index + 1}`,
    chunkId: exercise.id,
    questionChunkIds: exercise.questionChunkIds,
    solutionChunkIds: exercise.solutionChunkIds,
    solution: exercise.solution,
  }));
  const offered: OfferedExerciseUnit = {
    material: unit.materialName,
    language,
    exercises: exercises.map((exercise, index) => ({
      id: exercise.id,
      statement: batch[index]!.statement,
      solution: exercise.solution,
    })),
    kcs: known.offered,
  };
  const answer = await buildCall(
    supabase,
    {
      studentId: owner,
      task: "exercise",
      traceName: "extract-exercises",
      metadata: { courseId, unitKey: unitKey(unit) },
    },
    {
      ...exerciseExtractionSettings(offered),
      messages: exerciseExtractionMessages(offered),
    },
    exerciseExtractionSchema(),
  );
  if (typeof answer === "string" || answer instanceof RateLimited) {
    return answer;
  }
  const checked = checkExerciseAnswer(answer, exercises, known.storedId);
  return { kcs: checked.kcs, prerequisites: [], exercises: checked.exercises };
}
