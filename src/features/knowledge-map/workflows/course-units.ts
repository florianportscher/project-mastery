import "server-only";
import { chapterExtractionDigest } from "@/features/knowledge-map/ai/chapter-extraction";
import { exerciseExtractionDigest } from "@/features/knowledge-map/ai/exercise-extraction";
import {
  exerciseBatches,
  type ExerciseGroup,
} from "@/features/knowledge-map/domain/exercise-groups";
import {
  batchTitle,
  teachingBatches,
  UNIT_CHARS,
  unitHash,
} from "@/features/knowledge-map/domain/teaching-batches";
import { partialHash } from "@/features/knowledge-map/domain/unit-pieces";
import { allRows } from "@/lib/supabase/all-rows";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The Course's units: the teaching batches and exercise batches its
 * extraction calls read, keyed by `unitKey`, and their stored extractions
 * (`unit_extractions`).
 */

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

type BatchExercise = ExerciseGroup & {
  /** Its first question chunk, which keys the stored Exercise. */
  id: string;
  statement: string;
  /** Its solution chunks' Markdown, joined; null without any. */
  solution: string | null;
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

/** What the grouping step stored (`knowledge_map_builds.exercise_groups`). */
export type StoredGroups = { exercises: ExerciseGroup[]; fallback: boolean };

export async function loadStoredGroups(
  supabase: AdminSupabase,
  courseId: string,
): Promise<{ groups: StoredGroups | null; hash: string | null }> {
  const { data, error } = await supabase
    .from("knowledge_map_builds")
    .select("exercise_groups, exercise_grouping_hash")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) failed("Loading the Exercise groups", error);
  return {
    groups: (data?.exercise_groups as StoredGroups | null) ?? null,
    hash: data?.exercise_grouping_hash ?? null,
  };
}

const joined = (markdowns: string[]) => markdowns.join("\n\n");

/**
 * The Course's exercise batches in Course order: its Exercises as the
 * grouping step stored them, packed into the batches of the exercise
 * extraction (`exerciseBatches`). Each is keyed by the Material of its
 * first Exercise's first question chunk, numbered among that Material's
 * batches, and its hash covers its Exercises' chunks. A chunk gone since
 * the grouping is left out, and so is an Exercise left without a question
 * chunk.
 */
async function loadExerciseBatches(
  supabase: AdminSupabase,
  courseId: string,
): Promise<CourseUnit[]> {
  const [{ groups }, materials, chunks] = await Promise.all([
    loadStoredGroups(supabase, courseId),
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position"),
    allRows("Loading the exercise chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id, heading, markdown, page_from, page_to")
        .eq("course_id", courseId)
        .in("label", ["exercise", "solution"])
        .order("id")
        .range(from, to),
    ),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  if (!groups) return [];
  const chunkOf = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const exercises = groups.exercises.flatMap((group) => {
    const present = (ids: string[]) => ids.filter((id) => chunkOf.has(id));
    const questionChunkIds = present(group.questionChunkIds);
    const solutionChunkIds = present(group.solutionChunkIds);
    const first = chunkOf.get(questionChunkIds[0] ?? "");
    if (!first) return [];
    const markdown = (ids: string[]) =>
      ids.map((id) => chunkOf.get(id)!.markdown);
    const statement = joined(markdown(questionChunkIds));
    const solution =
      solutionChunkIds.length > 0 ? joined(markdown(solutionChunkIds)) : null;
    return [
      {
        material: first.material_id,
        heading: first.heading,
        pages: { pageFrom: first.page_from, pageTo: first.page_to },
        chars: statement.length + (solution?.length ?? 0),
        exercise: {
          id: first.id,
          questionChunkIds,
          solutionChunkIds,
          statement,
          solution,
        } satisfies BatchExercise,
      },
    ];
  });

  const batchesOf = new Map<string, number>();
  return exerciseBatches(exercises, UNIT_CHARS).flatMap((items) => {
    const materialId = items[0]!.material;
    const material = materials.data.find((m) => m.id === materialId);
    if (!material) return [];
    const batch = batchesOf.get(materialId) ?? 0;
    batchesOf.set(materialId, batch + 1);
    return [
      {
        materialId,
        kind: "exercise" as const,
        batch,
        title: batchTitle(
          material.name,
          items.map((item) => item.pages),
        ),
        contentHash: unitHash(
          items.map(({ exercise: e }) =>
            [...e.questionChunkIds, "|", ...e.solutionChunkIds].join(","),
          ),
        ),
        promptDigest: exerciseExtractionDigest(),
        materialName: material.name,
        chunks: items.map(({ exercise: e, heading }) => ({
          id: e.id,
          heading,
          markdown: e.solution
            ? `${e.statement}\n\n${e.solution}`
            : e.statement,
        })),
        exercises: items.map((item) => item.exercise),
      },
    ];
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
  /** Null for a row stored without one; such a row is never current. */
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
