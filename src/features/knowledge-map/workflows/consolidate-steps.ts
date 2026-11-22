import "server-only";
import { REVIVE_SIMILARITY } from "@/features/knowledge-map/domain/kc-clusters";
import { exerciseDifficulty } from "@/features/knowledge-map/domain/exercise-extraction";
import { acyclicLinks } from "@/features/knowledge-map/domain/prerequisite-cycles";
import {
  storedExtractionSchema,
  type ExtractedExercise,
  type StoredExtraction,
} from "@/features/knowledge-map/schemas";
import {
  loadCurrentExtractions,
  touchBuild,
  UNITS_PER_STEP,
  type StepOutcome,
  type StoredUnit,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  dailyLimitReason,
  meteredEmbed,
  RATE_LIMITED_STEP_RETRIES,
} from "@/features/usage/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The consolidation of a build: the KCs of stored unit extractions become
 * stored KCs, without a model call. Each new KC gets its vector, and one
 * within REVIVE_SIMILARITY of a retired KC revives it. A repeat adds its
 * chunks to the sources of the KC it names. What a new KC uses from outside
 * the Course becomes text on it (`kcs.assumes`). An exercise unit's
 * extraction also stores its Exercises, in place by their question chunks.
 */

/** Parallel `match_kcs` calls. */
const MATCHES_AT_ONCE = 10;

/** A unit extraction not stored as KCs yet. */
type Pending = { extractionId: string; extraction: StoredExtraction };

/** A new KC of the step, by key: `<unit index>:<kc index>`. */
type FreshKc = {
  key: string;
  part: number;
  kc: StoredExtraction["kcs"][number] & { embedding: number[] };
};

/**
 * Stores the KCs of up to UNITS_PER_STEP pending unit extractions, in
 * Course order. A reached Daily limit stops the build.
 */
export async function consolidateKcs(courseId: string): Promise<StepOutcome> {
  "use step";
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId);
  if (!owner) return { ok: true, left: null };
  const left = await storePendingExtractions(supabase, owner, courseId);
  if (left === "limit") return { ok: false, reason: dailyLimitReason };
  return { ok: true, left: left === "stopped" ? null : left };
}

consolidateKcs.maxRetries = RATE_LIMITED_STEP_RETRIES;

/**
 * Stores the KCs of up to UNITS_PER_STEP pending unit extractions that
 * `accept` takes, in Course order, and then what their new KCs use from
 * outside the Course as text, marking them matched. Text of extractions
 * stored before but not marked (a step that stopped in between) is written
 * first. Returns how many accepted extractions are left, "limit" when the
 * Daily limit is reached and "stopped" when the build no longer runs.
 */
export async function storePendingExtractions(
  supabase: AdminSupabase,
  owner: string,
  courseId: string,
  accept: (row: StoredUnit) => boolean = () => true,
): Promise<number | "limit" | "stopped"> {
  const current = await loadCurrentExtractions(supabase, courseId);
  const unwritten = current.filter(
    (row) => row.kcIds !== null && !row.assumesMatched,
  );
  if (
    unwritten.length > 0 &&
    !(await storeOutside(
      supabase,
      courseId,
      unwritten.map((row) => ({
        extractionId: row.id,
        extraction: storedExtractionSchema.parse(row.output),
        kcIds: row.kcIds!,
      })),
    ))
  ) {
    return "stopped";
  }
  const pending = current.filter((row) => row.kcIds === null && accept(row));
  if (pending.length === 0) return 0;

  const batch: Pending[] = pending.slice(0, UNITS_PER_STEP).map((row) => ({
    extractionId: row.id,
    extraction: storedExtractionSchema.parse(row.output),
  }));
  if (!(await embedMissing(supabase, { owner, courseId }, batch))) {
    return "limit";
  }
  const fresh: FreshKc[] = batch.flatMap((part, p) =>
    part.extraction.kcs.map((kc, k) => ({
      key: `${p}:${k}`,
      part: p,
      kc: { ...kc, embedding: kc.embedding! },
    })),
  );
  const revived = await reviveRetired(supabase, courseId, fresh);
  const kcIds = await storeKcs(supabase, courseId, { batch, fresh, revived });
  if (kcIds === null) return "stopped";
  const written = await storeOutside(
    supabase,
    courseId,
    batch.map((part, p) => ({ ...part, kcIds: kcIds[p]! })),
  );
  if (!written) return "stopped";
  return pending.length - batch.length;
}

/**
 * Embeds the batch's KCs without a vector in one call (task `embed`) and
 * stores the vectors with their extractions, so a later step does not pay
 * for them again. False when the Daily limit is reached.
 */
async function embedMissing(
  supabase: AdminSupabase,
  { owner, courseId }: { owner: string; courseId: string },
  batch: Pending[],
): Promise<boolean> {
  const missing = batch.flatMap((part) =>
    part.extraction.kcs.filter((kc) => !kc.embedding),
  );
  if (missing.length === 0) return true;
  const vectors = await meteredEmbed(
    supabase,
    { studentId: owner, traceName: "embed-kcs", metadata: { courseId } },
    {
      values: missing.map((kc) => `${kc.name}: ${kc.description}`),
      asDocuments: true,
    },
    async (embeddings) => {
      missing.forEach((kc, index) => {
        kc.embedding = embeddings[index];
      });
      for (const part of batch) {
        const { error } = await supabase
          .from("unit_extractions")
          .update({ output: part.extraction })
          .eq("id", part.extractionId);
        if (error) failed("Storing the KC vectors", error);
      }
    },
  );
  return vectors !== null;
}

type Match = { id: string; similarity: number };

/**
 * The Course's `count` live KCs, or with `retired` its retired ones,
 * nearest to `embedding` (a vector, or its text form), most alike first.
 */
async function matchKcs(
  supabase: AdminSupabase,
  courseId: string,
  embedding: number[] | string,
  count: number,
  retired: boolean,
): Promise<Match[]> {
  const { data, error } = await supabase.rpc("match_kcs", {
    p_course_id: courseId,
    p_embedding:
      typeof embedding === "string" ? embedding : JSON.stringify(embedding),
    p_count: count,
    p_retired: retired,
  });
  if (error) failed("Matching the KCs", error);
  return data;
}

/** The retired KC each new KC revives, by key. */
async function reviveRetired(
  supabase: AdminSupabase,
  courseId: string,
  fresh: FreshKc[],
): Promise<Map<string, string>> {
  const revived = new Map<string, string>();
  for (let start = 0; start < fresh.length; start += MATCHES_AT_ONCE) {
    await Promise.all(
      fresh.slice(start, start + MATCHES_AT_ONCE).map(async ({ key, kc }) => {
        const [retired] = await matchKcs(
          supabase,
          courseId,
          kc.embedding,
          1,
          true,
        );
        if (retired && retired.similarity >= REVIVE_SIMILARITY) {
          revived.set(key, retired.id);
        }
      }),
    );
  }
  return revived;
}

/** A KC row of `store_unit_kcs`. */
type StoredKcRow = {
  id: string;
  new: boolean;
  name?: string;
  description?: string;
  origin?: "content" | "exercise";
  embedding?: string;
  sources: string[];
};

/**
 * Stores the batch's KCs, the sources of the KCs its units teach again and
 * the Prerequisites with `store_unit_kcs`: each unit's KC ids, by index
 * into its `kcs`, or null when the build no longer runs.
 */
async function storeKcs(
  supabase: AdminSupabase,
  courseId: string,
  {
    batch,
    fresh,
    revived,
  }: {
    batch: Pending[];
    fresh: FreshKc[];
    revived: ReadonlyMap<string, string>;
  },
): Promise<string[][] | null> {
  const rows = new Map<string, StoredKcRow>();
  const idOfKey = new Map<string, string>();
  for (const { key, part, kc } of fresh) {
    const revivedId = revived.get(key);
    if (revivedId) {
      idOfKey.set(key, revivedId);
      continue;
    }
    const id = crypto.randomUUID();
    idOfKey.set(key, id);
    rows.set(id, {
      id,
      new: true,
      name: kc.name,
      description: kc.description,
      origin: batch[part]!.extraction.exercises ? "exercise" : "content",
      embedding: JSON.stringify(kc.embedding),
      sources: [],
    });
  }
  const addSources = (id: string, chunkIds: readonly string[]) => {
    const row = rows.get(id) ?? { id, new: false, sources: [] };
    row.sources.push(...chunkIds);
    rows.set(id, row);
  };
  for (const { key, kc } of fresh) addSources(idOfKey.get(key)!, kc.chunkIds);
  for (const { extraction } of batch) {
    for (const repeat of extraction.repeats ?? []) {
      addSources(repeat.kcId, repeat.chunkIds);
    }
  }

  const idOf = (part: number, k: number) => idOfKey.get(`${part}:${k}`)!;
  const links = batch.flatMap(({ extraction }, part) => [
    ...extraction.prerequisites.map((link) => ({
      from: idOf(part, link.from),
      to: idOf(part, link.to),
    })),
    ...(extraction.knownPrerequisites ?? []).map((link) => ({
      from: link.from,
      to: idOf(part, link.to),
    })),
  ]);
  const storedLinks = await supabase
    .from("prerequisite_links")
    .select("from_kc, to_kc")
    .eq("course_id", courseId);
  if (storedLinks.error) {
    failed("Loading the Prerequisites", storedLinks.error);
  }

  const kcIds = batch.map(({ extraction }, part) =>
    extraction.kcs.map((_, k) => idOf(part, k)),
  );
  const { data, error } = await supabase.rpc("store_unit_kcs", {
    p_course_id: courseId,
    p_kcs: [...rows.values()],
    p_prerequisites: acyclicLinks(
      storedLinks.data.map((link) => ({ from: link.from_kc, to: link.to_kc })),
      links,
    ),
    p_units: batch.map(({ extractionId, extraction }, part) => ({
      extractionId,
      kcIds: kcIds[part]!,
      ...(extraction.exercises && {
        chunkIds: extraction.exercises.flatMap(
          (exercise) => exercise.questionChunkIds,
        ),
        exercises: storedExercises(extraction.exercises, (k) => idOf(part, k)),
      }),
    })),
  });
  if (error) failed("Storing the KCs", error);
  return data ? kcIds : null;
}

/**
 * Stores what the units' new KCs use from outside the Course as text on
 * them (`kcs.assumes`) and marks the extractions matched, in one
 * transaction. False when the build no longer runs.
 */
async function storeOutside(
  supabase: AdminSupabase,
  courseId: string,
  units: ReadonlyArray<Pending & { kcIds: readonly string[] }>,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("store_assumed_prerequisites", {
    p_course_id: courseId,
    p_prerequisites: [],
    p_assumes: units.flatMap(({ extraction, kcIds }) =>
      extraction.kcs.flatMap((kc, k) =>
        kcIds[k] === undefined
          ? []
          : kc.assumes.map((assumed) => ({ kc: kcIds[k]!, ...assumed })),
      ),
    ),
    p_matched: [],
    p_extraction_ids: units.map((unit) => unit.extractionId),
  });
  if (error) failed("Storing what the KCs assume", error);
  return data;
}

/**
 * The Exercises of an exercise unit's extraction as `store_unit_kcs`
 * takes them: its new KCs by their stored ids, and its difficulty.
 */
function storedExercises(
  exercises: ExtractedExercise[],
  newKcId: (index: number) => string,
) {
  return exercises
    .filter((exercise) => !exercise.notAnExercise)
    .map((exercise) => {
      const kcIds = [
        ...new Set([...exercise.kcIds, ...exercise.newKcs.map(newKcId)]),
      ];
      return {
        questionChunkId: exercise.chunkId,
        questionChunkIds: exercise.questionChunkIds,
        solutionChunkIds: exercise.solutionChunkIds,
        kcIds,
        finalAnswers: exercise.finalAnswers,
        difficulty: exerciseDifficulty(kcIds.length, exercise.solutionLines),
      };
    });
}
