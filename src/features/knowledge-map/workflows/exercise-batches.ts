import "server-only";
import { exerciseExtractionDigest } from "@/features/knowledge-map/ai/exercise-extraction";
import {
  batchTitle,
  UNIT_CHARS,
  unitHash,
} from "@/features/knowledge-map/domain/teaching-batches";
import {
  exerciseBatches,
  type ExerciseGroup,
} from "@/features/knowledge-map/domain/exercise-groups";
import { allRows } from "@/lib/supabase/all-rows";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";
import type { CourseUnit } from "./build-steps";

/**
 * The Course's Exercises as the grouping step stored them, packed into the
 * batches of the exercise extraction (`exerciseBatches`).
 */

export type BatchExercise = ExerciseGroup & {
  /** Its first question chunk, which keys the stored Exercise. */
  id: string;
  statement: string;
  /** Its solution chunks' Markdown, joined; null without any. */
  solution: string | null;
};

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
 * The Course's exercise batches in Course order. Each is keyed by the
 * Material of its first Exercise's first question chunk, numbered among
 * that Material's batches, and its hash covers its Exercises' chunks. A
 * chunk gone since the grouping is left out, and so is an Exercise left
 * without a question chunk.
 */
export async function loadExerciseBatches(
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
