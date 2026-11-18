import "server-only";
import {
  chapterExtractionMessages,
  chapterExtractionSchema,
  chapterExtractionSettings,
  type KnownKc,
  type OfferedChunk,
  type OfferedUnit,
} from "@/features/knowledge-map/ai/chapter-extraction";
import { dailyLimitReason } from "@/features/knowledge-map/domain/build-failure";
import {
  checkExtraction,
  type UnitExtraction,
} from "@/features/knowledge-map/domain/chapter-extraction";
import {
  MIN_UNIT_COVERAGE,
  unitCoverage,
} from "@/features/knowledge-map/domain/unit-coverage";
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
import {
  kcsInCourseOrder,
  loadMapInput,
} from "@/features/knowledge-map/workflows/map-input";
import { RATE_LIMITED_STEP_RETRIES } from "@/features/usage/server";
import {
  BUILD_CALL_TIMEOUT_MS,
  callFits,
  retryTimeoutMs,
} from "@/lib/ai/call-timeout";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The extraction steps of a build: one call per teaching unit (task `map`)
 * whose content has no stored extraction, one after another in Course
 * order. Each call is offered every live KC stored so far, and its answer
 * is stored in `chapter_extractions` and then as KCs before the next call,
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
export async function extractChapters(
  courseId: string,
  failed: readonly string[] = [],
  deferred: readonly string[] = [],
): Promise<StepOutcome> {
  "use step";
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId);
  if (!owner) return { ok: true, left: null };

  const units = await loadCourseUnits(supabase, courseId, "content");
  const complete = new Map(
    units.map((unit) => [unitKey(unit), unit.contentHash]),
  );
  // A complete extraction is stored as KCs at once; a partial one waits
  // until its unit is complete or given up (`consolidateKcs`).
  const storeComplete = () =>
    storePendingExtractions(
      supabase,
      owner,
      courseId,
      (row) => complete.get(row.key) === row.contentHash,
    );
  const before = await storeComplete();
  if (before === "limit") return { ok: false, reason: dailyLimitReason };
  if (before === "stopped") return { ok: true, left: null };

  const stored = await loadStoredUnits(supabase, courseId);
  const hashOf = new Map(stored.map((row) => [row.key, row.contentHash]));
  const todo = units.filter(
    (unit) => hashOf.get(unitKey(unit)) !== unit.contentHash,
  );
  const attempts = planAttempts(todo, stored, failed, deferred);
  if (attempts.length === 0) return { ok: true, left: 0 };

  const language = await loadCourseLanguage(supabase, courseId);
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
          unit,
          chunks,
          language,
          known,
          startedAt,
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

/** The live KCs stored so far in Course order, with ids for the call. */
async function loadKnownKcs(
  supabase: AdminSupabase,
  courseId: string,
): Promise<{ offered: KnownKc[]; storedId: Map<string, string> }> {
  const kcs = kcsInCourseOrder(await loadMapInput(supabase, courseId));
  const offered = kcs.map((kc, index) => ({
    id: `k${index + 1}`,
    chapter: kc.chapter,
    name: kc.name,
    description: kc.description,
  }));
  return {
    offered,
    storedId: new Map(kcs.map((kc, index) => [offered[index]!.id, kc.id])),
  };
}

extractChapters.maxRetries = RATE_LIMITED_STEP_RETRIES;

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
    unit: whole,
    chunks,
    language,
    known,
    startedAt,
  }: {
    unit: CourseUnit;
    chunks: CourseUnit["chunks"];
    language: string;
    known: Awaited<ReturnType<typeof loadKnownKcs>>;
    startedAt: number;
  },
): Promise<UnitExtraction | "limit" | "failed" | RateLimited> {
  const unit = { ...whole, chunks };
  const offered = unit.chunks.map((chunk, index): OfferedChunk => ({
    id: `c${index + 1}`,
    markdown: chunk.markdown,
  })) as [OfferedChunk, ...OfferedChunk[]];
  const offeredUnit: OfferedUnit = {
    material: unit.materialName,
    outline: unit.outline,
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
      { studentId: owner, task: "map", traceName: "extract-chapter" },
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
