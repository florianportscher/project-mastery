import "server-only";
import type { KnownKc } from "@/features/knowledge-map/ai/chapter-extraction";
import type { UnitExtraction } from "@/features/knowledge-map/domain/chapter-extraction";
import {
  storedExtractionSchema,
  type BuildProgress,
  type BuildStage,
  type StoredExtraction,
} from "@/features/knowledge-map/schemas";
import { RateLimited } from "@/features/knowledge-map/workflows/build-call";
import {
  countedProgress,
  loadCourseLanguageName,
  recordProgress,
  runCalls,
  UNITS_PER_STEP,
  type StepOutcome,
} from "@/features/knowledge-map/workflows/build-steps";
import { storePendingExtractions } from "@/features/knowledge-map/workflows/consolidate-steps";
import {
  isCurrent,
  sourceChunkIds,
  unitKey,
  type CourseUnit,
  type StoredUnit,
} from "@/features/knowledge-map/workflows/course-units";
import {
  kcsInCourseOrder,
  loadMapInput,
  withoutOwnKcs,
} from "@/features/knowledge-map/workflows/map-input";
import {
  givenUp,
  joinExtractions,
  partialHash,
  unitPieces,
  type UnitPiece,
} from "@/features/knowledge-map/domain/unit-pieces";
import { dailyLimitReason } from "@/features/usage/server";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * What both extraction steps (`extract-steps.ts`, `exercise-steps.ts`)
 * share once they know their units to call: the order of the calls, the
 * KCs each is offered, and how its answer is stored.
 */

/** What a unit's call is offered besides its own text. */
export type UnitOffer = {
  language: string;
  known: { offered: KnownKc[]; storedId: Map<string, string> };
};

/**
 * Calls the planned `attempts` of an extraction step, up to UNITS_PER_STEP,
 * one after another in Course order while a call still fits the step. Each
 * call is offered the live KCs stored so far (`loadKnownKcs`), and each
 * unit's complete extraction is stored as KCs before the next call
 * (`storeComplete`). The step's `stage` counts the units done. A unit the
 * rate limit turned away stops the step and goes after the others
 * (`deferred`), once the workflow waited (`waitMs`). A unit whose call
 * fails is left to the next step (`failed`). A reached Daily limit stops
 * the build; what is stored stays.
 */
export async function extractInCourseOrder(
  supabase: AdminSupabase,
  step: {
    owner: string;
    courseId: string;
    startedAt: number;
    stage: BuildStage;
    progress: BuildProgress | null;
  },
  plan: {
    /** The step's units, all of them. */
    units: readonly CourseUnit[];
    /** Its units without a current extraction. */
    todo: readonly CourseUnit[];
    attempts: readonly UnitAttempt[];
  },
  callPiece: (
    unit: CourseUnit,
    chunks: CourseUnit["chunks"],
    offer: UnitOffer,
  ) => Promise<StoredExtraction | "limit" | "failed" | RateLimited>,
): Promise<StepOutcome> {
  const { owner, courseId, startedAt } = step;
  const { attempts } = plan;
  if (attempts.length === 0) return { ok: true, left: 0 };
  let progress = countedProgress(step.progress, step.stage, attempts.length);
  await recordProgress(supabase, courseId, progress);

  const language = await loadCourseLanguageName(supabase, courseId);
  let done = 0;
  const failedKeys: string[] = [];
  const stale = new Map(plan.todo.map((unit) => [unitKey(unit), unit]));
  for (const attempt of attempts.slice(0, UNITS_PER_STEP)) {
    if (!callFits(startedAt, BUILD_CALL_TIMEOUT_MS)) break;
    const known = await loadKnownKcs(supabase, courseId, [...stale.values()]);
    const outcome = await extractAttempts(
      supabase,
      { owner, courseId },
      [attempt],
      (unit, chunks) => callPiece(unit, chunks, { language, known }),
      startedAt,
    );
    if (outcome.limit) return { ok: false, reason: dailyLimitReason };
    failedKeys.push(...outcome.failedKeys);
    done += outcome.done;
    if (outcome.done > 0) {
      stale.delete(unitKey(attempt.unit));
      const after = await storeComplete(supabase, owner, courseId, plan.units);
      if (after === "limit") return { ok: false, reason: dailyLimitReason };
      if (after === "stopped") return { ok: true, left: null };
    }
    if (outcome.done > 0 || outcome.waitMs !== undefined) {
      progress = { ...progress, done: (progress.done ?? 0) + outcome.done };
      await recordProgress(supabase, courseId, progress, outcome.waitMs);
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

/**
 * Stores as KCs (and Exercises) the complete extractions of `units` that
 * are current and not stored yet; a partial one waits until its unit is
 * complete or given up (`consolidateKcs`).
 */
export function storeComplete(
  supabase: AdminSupabase,
  owner: string,
  courseId: string,
  units: readonly CourseUnit[],
) {
  const unitOf = new Map(units.map((unit) => [unitKey(unit), unit]));
  return storePendingExtractions(supabase, owner, courseId, (row) => {
    const unit = unitOf.get(row.key);
    return unit !== undefined && isCurrent(row, unit);
  });
}

/**
 * The live KCs a unit's call is offered, in Course order: not those sourced
 * only on the chunks of units still to extract (`staleUnits`, the unit itself
 * included), so that a unit extracted again names its KCs anew instead of
 * repeating the ones it, or a unit not yet extracted again, gave before.
 */
async function loadKnownKcs(
  supabase: AdminSupabase,
  courseId: string,
  staleUnits: readonly CourseUnit[],
): Promise<UnitOffer["known"]> {
  const kcs = kcsInCourseOrder(
    withoutOwnKcs(
      await loadMapInput(supabase, courseId),
      staleUnits.flatMap(sourceChunkIds),
    ),
  );
  const offered = kcs.map((kc, index) => ({
    id: `k${index + 1}`,
    heading: kc.heading,
    name: kc.name,
    description: kc.description,
  }));
  return {
    offered,
    storedId: new Map(kcs.map((kc, index) => [offered[index]!.id, kc.id])),
  };
}

/**
 * Stores a unit's extraction, replacing an earlier one, as not consolidated
 * and not matched yet; with `partial`, as the pieces answered so far
 * (`partialHash`).
 */
async function storeExtraction(
  supabase: AdminSupabase,
  {
    owner,
    courseId,
    unit,
  }: { owner: string; courseId: string; unit: CourseUnit },
  output: UnitExtraction | StoredExtraction,
  partial = false,
) {
  const { error } = await supabase.from("unit_extractions").upsert(
    {
      material_id: unit.materialId,
      kind: unit.kind,
      batch: unit.batch,
      owner,
      course_id: courseId,
      content_hash: partial ? partialHash(unit.contentHash) : unit.contentHash,
      prompt_digest: unit.promptDigest,
      output,
      kc_ids: null,
      assumes_matched: false,
    },
    { onConflict: "material_id,kind,batch" },
  );
  if (error) failed("Storing a unit extraction", error);
}

/**
 * The extraction steps' units to call, after the units of `failed` (a key
 * once per failed attempt) failed: those that failed less first, so a
 * failed unit waits until the others ran, each with its pieces still to
 * call (`unitPieces`) and the partial extraction it keeps. A unit of
 * `deferred` goes after the others that failed as often. Units given up on
 * (`givenUp`) are left out. A kept partial extraction whose KCs were stored
 * already (a unit given up in an earlier build) keeps them as repeats, so
 * they are not stored twice.
 */
export function planAttempts(
  todo: readonly CourseUnit[],
  stored: readonly StoredUnit[],
  failed: readonly string[],
  deferred: readonly string[] = [],
): UnitAttempt[] {
  const storedOf = new Map(stored.map((row) => [row.key, row]));
  return todo
    .map((unit) => {
      const key = unitKey(unit);
      const failures = failed.filter((k) => k === key).length;
      const sizes = unit.chunks.map((chunk) => chunk.markdown.length);
      const row = storedOf.get(key);
      const partial = isCurrent(row, unit, true)
        ? storedExtractionSchema.parse(row!.output)
        : null;
      const kept =
        partial && row?.kcIds && !partial.exercises
          ? asRepeats(partial, row.kcIds)
          : partial;
      const read = new Set(kept?.readChunkIds ?? []);
      const pieces = unitPieces(sizes, failures).filter((piece) =>
        unit.chunks
          .slice(piece.start, piece.end)
          .some((chunk) => !read.has(chunk.id)),
      );
      return {
        unit,
        failures,
        later: deferred.includes(key) ? 1 : 0,
        kept,
        pieces,
        givenUp: givenUp(sizes, failures),
      };
    })
    .filter((attempt) => !attempt.givenUp)
    .toSorted((a, b) => a.failures - b.failures || a.later - b.later);
}

function asRepeats(
  extraction: StoredExtraction,
  kcIds: readonly string[],
): StoredExtraction {
  return {
    readChunkIds: extraction.readChunkIds,
    kcs: [],
    prerequisites: [],
    repeats: [
      ...(extraction.repeats ?? []),
      ...extraction.kcs.flatMap((kc, k) =>
        kcIds[k] ? [{ kcId: kcIds[k], chunkIds: kc.chunkIds }] : [],
      ),
    ],
  };
}

export type UnitAttempt = {
  unit: CourseUnit;
  failures: number;
  /** The partial extraction of its pieces answered before. */
  kept: StoredExtraction | null;
  /** Its pieces still to call. */
  pieces: UnitPiece[];
};

/**
 * Calls the pieces of up to UNITS_PER_STEP attempts, as one round
 * (`runCalls`), and stores each unit's extraction: whole once every piece
 * is answered, else partial with the pieces answered so far. A unit with a
 * failed piece is in `failedKeys`; `limit` when the Daily limit stopped a
 * call. A piece the rate limit turned away is neither answered nor failed,
 * and no further call starts: `waitMs` is the longest wait it named.
 */
export async function extractAttempts(
  supabase: AdminSupabase,
  scope: { owner: string; courseId: string },
  attempts: readonly UnitAttempt[],
  callPiece: (
    unit: CourseUnit,
    chunks: CourseUnit["chunks"],
  ) => Promise<StoredExtraction | "limit" | "failed" | RateLimited>,
  startedAt: number,
): Promise<{
  done: number;
  failedKeys: string[];
  limit: boolean;
  waitMs?: number;
}> {
  const batch = attempts.slice(0, UNITS_PER_STEP);
  const answered = batch.map(
    () => [] as Array<{ start: number; extraction: StoredExtraction }>,
  );
  const failedUnits = new Set<number>();
  let limit = false;
  let waitMs: number | undefined;
  await runCalls(
    batch.flatMap((attempt, index) =>
      attempt.pieces.map((piece) => ({ index, piece })),
    ),
    async ({ index, piece }) => {
      const { unit } = batch[index]!;
      const chunks = unit.chunks.slice(piece.start, piece.end);
      const extraction = await callPiece(unit, chunks);
      if (extraction === "limit") {
        limit = true;
        return "stop";
      }
      if (extraction instanceof RateLimited) {
        waitMs = Math.max(waitMs ?? 0, extraction.waitMs);
        return "stop";
      }
      if (extraction === "failed") {
        failedUnits.add(index);
        return;
      }
      answered[index]!.push({
        start: piece.start,
        extraction: {
          ...extraction,
          readChunkIds: chunks.map((chunk) => chunk.id),
        },
      });
    },
    startedAt,
  );

  let done = 0;
  for (const [index, attempt] of batch.entries()) {
    const fresh = answered[index]!.toSorted((a, b) => a.start - b.start);
    const complete = fresh.length === attempt.pieces.length;
    if (fresh.length === 0 && !complete) continue;
    const joined = joinExtractions([
      ...(attempt.kept ? [attempt.kept] : []),
      ...fresh.map((part) => part.extraction),
    ]);
    if (complete) {
      await storeExtraction(
        supabase,
        { ...scope, unit: attempt.unit },
        { ...joined, readChunkIds: undefined },
      );
      done += 1;
    } else {
      await storeExtraction(
        supabase,
        { ...scope, unit: attempt.unit },
        joined,
        true,
      );
    }
  }
  return {
    done,
    failedKeys: [...failedUnits].map((index) => unitKey(batch[index]!.unit)),
    limit,
    waitMs,
  };
}
