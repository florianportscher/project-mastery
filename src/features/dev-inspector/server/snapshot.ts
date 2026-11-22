import "server-only";
import { buildFlags } from "@/features/dev-inspector/domain/flags";
import type { DevUnit, Flags, Snapshot } from "@/features/dev-inspector/types";
import {
  MIN_UNIT_COVERAGE,
  UNIT_CHARS,
  batchTitle,
  exerciseBatches,
  teachingBatches,
  unitKey,
} from "@/features/knowledge-map/server";
import { failed } from "@/lib/supabase/failed";
import { createClient } from "@/lib/supabase/server";

export type CourseInspection = {
  snapshot: Snapshot;
  units: DevUnit[];
  flags: Flags;
};

/**
 * What the parse and build stored for a Course, its units and suspect
 * spots, read as the signed-in developer, so only their own Courses: null
 * for any other. Callers check access with `requireDeveloper` first.
 */
export async function getCourseInspection(
  courseId: string,
): Promise<CourseInspection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("course_build_snapshot", {
    p_course_id: courseId,
  });
  if (error) failed("Reading the build snapshot", error);
  if (data === null) return null;
  // The SQL function defines the shape (types.ts).
  const snapshot = data as unknown as Snapshot;
  const units = courseUnits(snapshot);
  return {
    snapshot,
    units,
    flags: buildFlags(snapshot, units, MIN_UNIT_COVERAGE),
  };
}

/**
 * The batches the current chunks form, as the build forms them
 * (`loadCourseUnits`): teaching batches in Course order, then exercise
 * batches of the stored Exercises by position, each by its question chunks.
 */
function courseUnits(snapshot: Snapshot): DevUnit[] {
  const extractionOf = new Map(
    snapshot.extractions.map((e) => [unitKey(e), e]),
  );
  const chunkOf = new Map(snapshot.chunks.map((c) => [c.id, c]));
  const nameOf = new Map(snapshot.materials.map((m) => [m.id, m.name]));
  const unit = (
    kind: DevUnit["kind"],
    materialId: string,
    batch: number,
    chunkIds: string[],
  ): DevUnit => {
    const key = unitKey({ materialId, kind, batch });
    return {
      key,
      kind,
      materialId,
      batch,
      title: batchTitle(
        nameOf.get(materialId) ?? "",
        chunkIds.map((id) => chunkOf.get(id)!),
      ),
      chunkIds,
      extraction: extractionOf.get(key) ?? null,
    };
  };
  const teaching = snapshot.materials.flatMap((material) =>
    teachingBatches(
      snapshot.chunks
        .filter((c) => c.materialId === material.id && c.label === "content")
        .toSorted((a, b) => a.position - b.position),
    ).map((ids, batch) => unit("content", material.id, batch, ids)),
  );
  const exercises = snapshot.exercises
    .toSorted((a, b) => a.position - b.position)
    .flatMap((exercise) => {
      const first = chunkOf.get(exercise.questionChunkId);
      if (!first) return [];
      const chars = [...exercise.questionChunkIds, ...exercise.solutionChunkIds]
        .map((id) => chunkOf.get(id)?.chars ?? 0)
        .reduce((sum, n) => sum + n, 0);
      return [{ material: first.materialId, chars, id: first.id }];
    });
  const batchesOf = new Map<string, number>();
  const practice = exerciseBatches(exercises, UNIT_CHARS).map((items) => {
    const materialId = items[0]!.material;
    const batch = batchesOf.get(materialId) ?? 0;
    batchesOf.set(materialId, batch + 1);
    return unit(
      "exercise",
      materialId,
      batch,
      items.map((item) => item.id),
    );
  });
  return [...teaching, ...practice];
}

/** One chunk's Markdown, for a developer who owns it; null for any other. */
export async function getChunkMarkdown(
  chunkId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chunks")
    .select("markdown")
    .eq("id", chunkId)
    .maybeSingle();
  if (error) failed("Reading the chunk", error);
  return data?.markdown ?? null;
}
