import "server-only";
import {
  exerciseExtractionMessages,
  exerciseExtractionSchema,
  exerciseExtractionSettings,
  type OfferedExerciseUnit,
} from "@/features/knowledge-map/ai/exercise-extraction";
import { dailyLimitReason } from "@/features/knowledge-map/domain/build-failure";
import {
  checkExerciseAnswer,
  needsExerciseExtraction,
  type OfferedSubtask,
} from "@/features/knowledge-map/domain/exercise-extraction";
import {
  storedExtractionSchema,
  type StoredExtraction,
} from "@/features/knowledge-map/schemas";
import {
  extractAttempts,
  loadCourseLanguage,
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
import { RATE_LIMITED_STEP_RETRIES } from "@/features/usage/server";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { allRows } from "@/lib/supabase/all-rows";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The exercise steps of a build: one call (task `exercise`) per exercise
 * unit, with its subtasks, their paired solutions and every live KC of the
 * Course. Units run one after another in Course order, and each extraction
 * is stored in `chapter_extractions` and then as KCs and Exercises before
 * the next unit's call, so the KCs one proposed are listed for the next. A
 * unit is called again when its content changed or a subtask's paired
 * solution is no longer the one it was extracted with.
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

  const [units, stored, pairs] = await Promise.all([
    loadCourseUnits(supabase, courseId, "exercise"),
    loadStoredUnits(supabase, courseId),
    allRows("Loading the exercise pairs", (from, to) =>
      supabase
        .from("exercise_solutions")
        .select("exercise_chunk_id, solution_chunk_id")
        .eq("course_id", courseId)
        .order("exercise_chunk_id")
        .range(from, to),
    ),
  ]);
  const extractionOf = new Map(
    stored.map((row) => [
      row.key,
      {
        contentHash: row.contentHash,
        exercises: storedExtractionSchema.parse(row.output).exercises,
      },
    ]),
  );
  const pairOf = new Map(
    pairs.map((pair) => [pair.exercise_chunk_id, pair.solution_chunk_id]),
  );
  const solutionOf = (chunkId: string) => pairOf.get(chunkId) ?? null;

  const todo = units.filter((unit) =>
    needsExerciseExtraction(
      extractionOf.get(unitKey(unit)),
      {
        contentHash: unit.contentHash,
        exerciseChunkIds: unit.chunks.map((chunk) => chunk.id),
      },
      solutionOf,
    ),
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
  const language = await loadCourseLanguage(supabase, courseId);
  let done = 0;
  const failedKeys: string[] = [];
  for (const attempt of attempts.slice(0, UNITS_PER_STEP)) {
    if (!callFits(startedAt, BUILD_CALL_TIMEOUT_MS)) break;
    const known = await loadKnownKcs(supabase, courseId);
    const solutions = await loadMarkdowns(
      supabase,
      attempt.unit.chunks.flatMap((chunk) => solutionOf(chunk.id) ?? []),
    );
    const outcome = await extractAttempts(
      supabase,
      { owner, courseId },
      [attempt],
      (unit, chunks) =>
        extractUnit(supabase, owner, {
          unit: { ...unit, chunks },
          language,
          solutions,
          solutionOf,
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

/** The Markdown of these chunks by id; deleted ones are missing. */
async function loadMarkdowns(
  supabase: AdminSupabase,
  chunkIds: string[],
): Promise<Map<string, string>> {
  const markdowns = new Map<string, string>();
  const ids = [...new Set(chunkIds)];
  // Ids go in the query string, so long lists are read in slices.
  for (let start = 0; start < ids.length; start += 100) {
    const { data, error } = await supabase
      .from("chunks")
      .select("id, markdown")
      .in("id", ids.slice(start, start + 100));
    if (error) failed("Loading the solution texts", error);
    for (const chunk of data) markdowns.set(chunk.id, chunk.markdown);
  }
  return markdowns;
}

/** One exercise unit's call, checked; "limit" when the Daily limit is reached. */
async function extractUnit(
  supabase: AdminSupabase,
  owner: string,
  {
    unit,
    language,
    solutions,
    solutionOf,
    known,
  }: {
    unit: CourseUnit;
    language: string;
    solutions: ReadonlyMap<string, string>;
    solutionOf: (chunkId: string) => string | null;
    known: Awaited<ReturnType<typeof loadKnownKcs>>;
  },
): Promise<StoredExtraction | "limit" | "failed" | RateLimited> {
  const subtasks = unit.chunks.map((chunk, index): OfferedSubtask => {
    const solutionChunkId = solutionOf(chunk.id);
    return {
      id: `s${index + 1}`,
      chunkId: chunk.id,
      solutionChunkId,
      solution: (solutionChunkId && solutions.get(solutionChunkId)) ?? null,
    };
  });
  const offered: OfferedExerciseUnit = {
    material: unit.materialName,
    outline: unit.outline,
    language,
    subtasks: subtasks.map((subtask, index) => ({
      id: subtask.id,
      statement: unit.chunks[index]!.markdown,
      solution: subtask.solution,
    })),
    kcs: known.offered,
  };
  const answer = await buildCall(
    supabase,
    { studentId: owner, task: "exercise", traceName: "extract-exercises" },
    {
      ...exerciseExtractionSettings(offered),
      messages: exerciseExtractionMessages(offered),
    },
    exerciseExtractionSchema(),
  );
  if (typeof answer === "string" || answer instanceof RateLimited) {
    return answer;
  }
  const { kcs, exercises } = checkExerciseAnswer(
    answer,
    subtasks,
    known.storedId,
  );
  return { kcs, prerequisites: [], exercises };
}
