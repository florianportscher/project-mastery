import "server-only";
import {
  chapterExtractionMessages,
  chapterExtractionSchema,
  chapterExtractionSettings,
  type OfferedChunk,
  type OfferedUnit,
} from "@/features/knowledge-map/ai/chapter-extraction";
import {
  checkExtraction,
  type UnitExtraction,
} from "@/features/knowledge-map/domain/chapter-extraction";
import {
  MIN_UNIT_COVERAGE,
  unitCoverage,
} from "@/features/knowledge-map/domain/unit-coverage";
import {
  touchCountingBuild,
  type StepOutcome,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  isCurrent,
  loadCourseUnits,
  loadStoredUnits,
  unitKey,
  type CourseUnit,
} from "@/features/knowledge-map/workflows/course-units";
import {
  extractInCourseOrder,
  planAttempts,
  storeComplete,
  type UnitOffer,
} from "@/features/knowledge-map/workflows/extraction-attempts";
import {
  buildCall,
  RateLimited,
} from "@/features/knowledge-map/workflows/build-call";
import {
  dailyLimitReason,
  RATE_LIMITED_STEP_RETRIES,
} from "@/features/usage/server";
import { retryTimeoutMs } from "@/lib/ai/call-timeout";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The extraction steps of a build: one call per teaching unit (task `map`)
 * whose content has no stored extraction, one after another in Course
 * order. Each call is offered every live KC stored so far, and its answer
 * is stored in `unit_extractions` and then as KCs before the next call,
 * so a stopped build resumes without paying again.
 */

/**
 * Extracts up to UNITS_PER_STEP teaching units without a current
 * extraction, one after another in Course order, while a call still fits
 * the step. Each unit's complete extraction is stored as KCs before the
 * next unit's call, which is offered them. An answer whose KCs cite less
 * than MIN_UNIT_COVERAGE of the unit is asked once more with what is left
 * of the step, and the answer that covers more is stored; an answer with no
 * KCs is stored as it is. A unit the rate limit turned away stops the step
 * and goes after the others (`deferred`), once the workflow waited
 * (`waitMs`). A unit whose call fails is left to the next step and goes
 * after the others; after its second failure it is called in pieces,
 * halved again on each failure, until it is given up
 * (`domain/unit-pieces.ts`). So a failing unit never fails the build. A
 * reached Daily limit stops the build; what is stored stays.
 */
export async function extractTeachingBatches(
  courseId: string,
  failed: readonly string[] = [],
  deferred: readonly string[] = [],
): Promise<StepOutcome> {
  "use step";
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const touched = await touchCountingBuild(supabase, courseId);
  if (!touched) return { ok: true, left: null };
  const { owner } = touched;

  const units = await loadCourseUnits(supabase, courseId, "content");
  const before = await storeComplete(supabase, owner, courseId, units);
  if (before === "limit") return { ok: false, reason: dailyLimitReason };
  if (before === "stopped") return { ok: true, left: null };

  const stored = await loadStoredUnits(supabase, courseId);
  const storedOf = new Map(stored.map((row) => [row.key, row]));
  const todo = units.filter(
    (unit) => !isCurrent(storedOf.get(unitKey(unit)), unit),
  );
  return extractInCourseOrder(
    supabase,
    {
      owner,
      courseId,
      startedAt,
      stage: "materials",
      progress: touched.progress,
    },
    { units, todo, attempts: planAttempts(todo, stored, failed, deferred) },
    (unit, chunks, offer) =>
      extractUnit(supabase, owner, {
        courseId,
        unit,
        chunks,
        offer,
        startedAt,
      }),
  );
}

extractTeachingBatches.maxRetries = RATE_LIMITED_STEP_RETRIES;

/**
 * The extraction of a unit's chunks, all or a piece, checked: asked once
 * more when its KCs cite less than MIN_UNIT_COVERAGE of them and enough of
 * the step is left (`retryTimeoutMs`), the answer that covers more kept.
 * An answer with no KCs is kept without a retry: the unit teaches nothing.
 * "failed" when the first call gives no answer, "limit" when the Daily
 * limit stops the first call, `RateLimited` when the rate limit turns it
 * away.
 */
async function extractUnit(
  supabase: AdminSupabase,
  owner: string,
  {
    courseId,
    unit: whole,
    chunks,
    offer: { language, known },
    startedAt,
  }: {
    courseId: string;
    unit: CourseUnit;
    chunks: CourseUnit["chunks"];
    offer: UnitOffer;
    startedAt: number;
  },
): Promise<UnitExtraction | "limit" | "failed" | RateLimited> {
  const unit = { ...whole, chunks };
  const offered = unit.chunks.map((chunk, index): OfferedChunk => ({
    id: `c${index + 1}`,
    heading: chunk.heading,
    markdown: chunk.markdown,
  })) as [OfferedChunk, ...OfferedChunk[]];
  const offeredUnit: OfferedUnit = {
    material: unit.materialName,
    language,
    chunks: offered,
    knownKcs: known.offered,
  };
  const storedId = new Map(
    unit.chunks.map((chunk, index) => [offered[index]!.id, chunk.id]),
  );
  const call = async (timeoutMs?: number) => {
    const answer = await buildCall(
      supabase,
      {
        studentId: owner,
        task: "map",
        traceName: "extract-chapter",
        metadata: { courseId, unitKey: unitKey(whole) },
      },
      {
        ...chapterExtractionSettings(offeredUnit),
        messages: chapterExtractionMessages(offeredUnit),
      },
      chapterExtractionSchema(),
      timeoutMs,
    );
    return typeof answer === "string" || answer instanceof RateLimited
      ? answer
      : checkExtraction(answer, storedId, known.storedId);
  };
  const coverage = (extraction: UnitExtraction) =>
    unitCoverage(
      unit.chunks,
      extraction.kcs.flatMap((kc) => kc.chunkIds),
    );

  const first = await call();
  if (typeof first === "string" || first instanceof RateLimited) return first;
  const retryMs = retryTimeoutMs(startedAt);
  if (
    first.kcs.length === 0 ||
    coverage(first) >= MIN_UNIT_COVERAGE ||
    retryMs === null
  ) {
    return first;
  }
  console.warn(
    `The extract-chapter call covered ${Math.round(coverage(first) * 100)}% of its unit; once more.`,
  );
  // A second call that fails, meets the Daily limit or the rate limit keeps
  // the first, valid answer; a limit then stops the next call.
  const second = await call(retryMs);
  if (typeof second === "string" || second instanceof RateLimited) {
    return first;
  }
  return coverage(second) > coverage(first) ? second : first;
}
