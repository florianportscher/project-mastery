import "server-only";
import {
  batchTitle,
  teachingBatches,
  unitHash,
} from "@/features/knowledge-map/domain/teaching-batches";
import {
  loadExerciseBatches,
  type BatchExercise,
} from "@/features/knowledge-map/workflows/exercise-batches";
import type { UnitExtraction } from "@/features/knowledge-map/domain/chapter-extraction";
import { chapterExtractionDigest } from "@/features/knowledge-map/ai/chapter-extraction";
import { exerciseExtractionDigest } from "@/features/knowledge-map/ai/exercise-extraction";
import { loadCourseLanguage as loadLanguage } from "@/features/ingestion/server";
import {
  storedExtractionSchema,
  type StoredExtraction,
} from "@/features/knowledge-map/schemas";
import { RateLimited } from "@/features/knowledge-map/workflows/build-call";
import {
  givenUp,
  joinExtractions,
  partialHash,
  unitPieces,
  type UnitPiece,
} from "@/features/knowledge-map/domain/unit-pieces";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { getAiEnv } from "@/lib/ai/env";
import { allRows } from "@/lib/supabase/all-rows";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The steps of a Knowledge map update (`build-knowledge-map.ts`) that
 * prepare and end it, and what every step shares. Each runs on the admin
 * client, since no Student is signed in, and so scopes every query to the
 * Course itself. Each starts with `touchBuild`, which sets the build's
 * heartbeat, and does nothing once the build no longer runs.
 */

export const UNITS_PER_STEP = 8;

/**
 * What a step did: how many units it left for the next step, or null when
 * the build no longer runs, and the keys (`unitKey`) of the units whose
 * call failed, left to the next step; with `waitMs` when the Gateway's rate
 * limit turned a call away, so the workflow waits that long before the next
 * step; or why the build stops.
 */
export type StepOutcome =
  | {
      ok: true;
      left: number | null;
      failed?: string[];
      /** Units the rate limit turned away, to call after the others. */
      deferred?: string[];
      waitMs?: number;
    }
  | { ok: false; reason: string };

/**
 * A step of the build that the workflow calls until it leaves nothing,
 * passing the keys of the units whose call failed, once per failure, and
 * of those the rate limit turned away.
 */
export type BuildStep = (
  courseId: string,
  failed: readonly string[],
  deferred: readonly string[],
) => Promise<StepOutcome>;

/**
 * Sets the running build's heartbeat, so `queue_knowledge_map_build` sees
 * it alive, and returns the Course's owner. Null when no build runs.
 */
export async function touchBuild(
  supabase: AdminSupabase,
  courseId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("knowledge_map_builds")
    .update({ heartbeat_at: new Date().toISOString() })
    .eq("course_id", courseId)
    .eq("status", "building")
    .select("owner")
    .maybeSingle();
  if (error) failed("Recording the build's heartbeat", error);
  return data?.owner ?? null;
}

/**
 * Runs `call` on each item, at most AI_CONCURRENCY at a time, and starts
 * none once a call returned "stop", nor when one could no longer end in
 * time for a step that started at `stepStartedAt` (`callFits` with
 * BUILD_CALL_TIMEOUT_MS): in practice, one round of calls per step.
 */
export async function runCalls<Item>(
  items: readonly Item[],
  call: (item: Item) => Promise<"stop" | void>,
  stepStartedAt: number,
): Promise<void> {
  const queue = [...items];
  let stopped = false;
  const worker = async () => {
    while (!stopped && callFits(stepStartedAt, BUILD_CALL_TIMEOUT_MS)) {
      const item = queue.shift();
      if (item === undefined) return;
      if ((await call(item)) === "stop") stopped = true;
    }
  };
  await Promise.all(
    Array.from({ length: getAiEnv().AI_CONCURRENCY }, () => worker()),
  );
}

export type CourseUnit = {
  materialId: string;
  kind: "content" | "exercise";
  /** 0-based, among the Material's batches of that kind. */
  batch: number;
  /** Where it is, for the check report: "Material p. 3–7". */
  title: string;
  contentHash: string;
  /** The digest of its call's prompt (`promptDigest`). */
  promptDigest: string;
  materialName: string;
  /**
   * What its calls read: a teaching batch's chunks; an exercise batch's
   * Exercises, each by its first question chunk with its statement and
   * solutions as Markdown.
   */
  chunks: Array<{ id: string; heading: string | null; markdown: string }>;
  exercises?: BatchExercise[];
};

/**
 * The Course's units of one kind in Course order: its teaching batches, by
 * Materials by position, then their batches in reading order
 * (`teachingBatches`); or its exercise batches (`loadExerciseBatches`).
 */
export async function loadCourseUnits(
  supabase: AdminSupabase,
  courseId: string,
  kind: CourseUnit["kind"],
): Promise<CourseUnit[]> {
  if (kind === "exercise") return loadExerciseBatches(supabase, courseId);
  const [materials, chunks] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position"),
    allRows("Loading the chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id, heading, markdown, page_from, page_to")
        .eq("course_id", courseId)
        .eq("label", kind)
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  return materials.data.flatMap((material) => {
    const ofMaterial = chunks.filter((c) => c.material_id === material.id);
    const chunkOf = new Map(ofMaterial.map((chunk) => [chunk.id, chunk]));
    return teachingBatches(
      ofMaterial.map((c) => ({
        id: c.id,
        heading: c.heading,
        chars: c.markdown.length,
      })),
    ).map((ids, batch) => {
      const rows = ids.map((id) => chunkOf.get(id)!);
      return {
        materialId: material.id,
        kind,
        batch,
        title: batchTitle(
          material.name,
          rows.map((row) => ({ pageFrom: row.page_from, pageTo: row.page_to })),
        ),
        contentHash: unitHash(rows.map((row) => row.markdown)),
        promptDigest: chapterExtractionDigest(),
        materialName: material.name,
        chunks: rows.map((row) => ({
          id: row.id,
          heading: row.heading,
          markdown: row.markdown,
        })),
      };
    });
  });
}

/** The prompt digest of a unit kind's extraction call. */
export function extractionDigest(kind: CourseUnit["kind"]): string {
  return kind === "content"
    ? chapterExtractionDigest()
    : exerciseExtractionDigest();
}

export const unitKey = (unit: {
  materialId: string;
  kind: string;
  batch: number;
}) => `${unit.materialId}/${unit.kind}/${unit.batch}`;

export type StoredUnit = {
  id: string;
  key: string;
  contentHash: string;
  /** Null for an extraction stored before prompts were keyed (#375). */
  promptDigest: string | null;
  output: unknown;
  kcIds: string[] | null;
  assumesMatched: boolean;
};

export async function loadStoredUnits(
  supabase: AdminSupabase,
  courseId: string,
): Promise<StoredUnit[]> {
  const rows = await allRows("Loading the unit extractions", (from, to) =>
    supabase
      .from("unit_extractions")
      .select(
        "id, material_id, kind, batch, content_hash, prompt_digest, output, kc_ids, assumes_matched",
      )
      .eq("course_id", courseId)
      .order("id")
      .range(from, to),
  );
  return rows.map((row) => ({
    id: row.id,
    key: unitKey({
      materialId: row.material_id,
      kind: row.kind,
      batch: row.batch,
    }),
    contentHash: row.content_hash,
    promptDigest: row.prompt_digest,
    output: row.output,
    kcIds: row.kc_ids,
    assumesMatched: row.assumes_matched,
  }));
}

/**
 * Whether a stored extraction answers this unit as it is now: the same
 * content (or with `partial`, its pieces so far) and the same prompt.
 */
export function isCurrent(
  row: StoredUnit | undefined,
  unit: CourseUnit,
  partial = false,
): boolean {
  return (
    row !== undefined &&
    row.contentHash ===
      (partial ? partialHash(unit.contentHash) : unit.contentHash) &&
    row.promptDigest === unit.promptDigest
  );
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

/**
 * The chunks a unit's KCs are sourced on: a teaching batch's chunks, an
 * exercise batch's question chunks.
 */
export function sourceChunkIds(unit: CourseUnit): string[] {
  return unit.exercises
    ? unit.exercises.flatMap((exercise) => exercise.questionChunkIds)
    : unit.chunks.map((chunk) => chunk.id);
}

/**
 * The Course's stored extractions of current units, in Course order:
 * teaching units first, then exercise units, each with its unit's source
 * chunks (`sourceChunkIds`). Extractions of units that no longer exist are
 * deleted.
 */
export async function loadCurrentExtractions(
  supabase: AdminSupabase,
  courseId: string,
): Promise<Array<StoredUnit & { chunkIds: string[] }>> {
  const [content, exercise, stored] = await Promise.all([
    loadCourseUnits(supabase, courseId, "content"),
    loadCourseUnits(supabase, courseId, "exercise"),
    loadStoredUnits(supabase, courseId),
  ]);
  const units = [...content, ...exercise];
  const order = new Map(units.map((unit, index) => [unitKey(unit), index]));
  const gone = stored.filter((row) => !order.has(row.key));
  if (gone.length > 0) {
    const { error } = await supabase
      .from("unit_extractions")
      .delete()
      .in(
        "id",
        gone.map((row) => row.id),
      );
    if (error) failed("Deleting the extractions of gone units", error);
  }
  return stored
    .filter((row) => order.has(row.key))
    .toSorted((a, b) => order.get(a.key)! - order.get(b.key)!)
    .map((row) => ({
      ...row,
      chunkIds: sourceChunkIds(units[order.get(row.key)!]!),
    }));
}

/**
 * The Course language by name: the one the Student asked for in the
 * Brief, else the most common language of its Materials; English when none
 * has one.
 */
export async function loadCourseLanguageName(
  supabase: AdminSupabase,
  courseId: string,
): Promise<string> {
  return (await loadLanguage(supabase, courseId)).name;
}

/**
 * Prepares a build: "nothing" when the Course has no content or exercise
 * chunks, "stopped" when the build no longer runs. Retires the KCs whose
 * sources are all gone.
 */
export async function prepareBuild(
  courseId: string,
): Promise<"ready" | "nothing" | "stopped"> {
  "use step";
  const supabase = createAdminClient();
  if (!(await touchBuild(supabase, courseId))) return "stopped";
  // This build reads the Course as it is now; a change from here on marks
  // the map again.
  const cleared = await supabase
    .from("knowledge_map_builds")
    .update({ needs_update: false })
    .eq("course_id", courseId);
  if (cleared.error) failed("Clearing the map's update mark", cleared.error);
  const chunks = await supabase
    .from("chunks")
    .select("id")
    .eq("course_id", courseId)
    .in("label", ["content", "exercise"])
    .limit(1);
  if (chunks.error) failed("Loading the chunks", chunks.error);
  if (chunks.data.length === 0) return "nothing";
  await retireUnsourcedKcs(supabase, courseId);
  return "ready";
}

export async function retireUnsourcedKcs(
  supabase: AdminSupabase,
  courseId: string,
) {
  const { error } = await supabase.rpc("retire_unsourced_kcs", {
    p_course_id: courseId,
  });
  if (error) failed("Retiring the KCs without sources", error);
}

export async function failBuild(
  courseId: string,
  reason: string,
): Promise<void> {
  "use step";
  const { error } = await createAdminClient()
    .from("knowledge_map_builds")
    .update({ status: "failed", failure_reason: reason })
    .eq("course_id", courseId)
    .eq("status", "building");
  if (error) failed("Recording the failed build", error);
}
