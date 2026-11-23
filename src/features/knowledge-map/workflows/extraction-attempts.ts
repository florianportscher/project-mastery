import "server-only";
import type { UnitExtraction } from "@/features/knowledge-map/domain/chapter-extraction";
import {
  storedExtractionSchema,
  type StoredExtraction,
} from "@/features/knowledge-map/schemas";
import { RateLimited } from "@/features/knowledge-map/workflows/build-call";
import {
  runCalls,
  UNITS_PER_STEP,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  isCurrent,
  unitKey,
  type CourseUnit,
  type StoredUnit,
} from "@/features/knowledge-map/workflows/course-units";
import {
  givenUp,
  joinExtractions,
  partialHash,
  unitPieces,
  type UnitPiece,
} from "@/features/knowledge-map/domain/unit-pieces";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

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
