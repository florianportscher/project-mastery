import "server-only";
import { buildFlags } from "@/features/dev-inspector/domain/flags";
import type { DevUnit, Flags, Snapshot } from "@/features/dev-inspector/types";
import {
  MIN_UNIT_COVERAGE,
  chapterUnits,
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
 * The units the current chunks form, as the build forms them
 * (`loadCourseUnits`): teaching units in Course order, then exercise
 * units.
 */
function courseUnits(snapshot: Snapshot): DevUnit[] {
  const extractionOf = new Map(
    snapshot.extractions.map((e) => [unitKey(e), e]),
  );
  return (["content", "exercise"] as const).flatMap((kind) =>
    snapshot.materials.flatMap((material) => {
      const outline = snapshot.chapters
        .filter((c) => c.materialId === material.id)
        .toSorted((a, b) => a.position - b.position);
      const chunks = snapshot.chunks
        .filter((c) => c.materialId === material.id && c.label === kind)
        .toSorted((a, b) => a.position - b.position);
      return chapterUnits(
        outline.map((c) => ({ id: c.id, parentId: c.parentId })),
        chunks,
      ).map((unit) => {
        const key = unitKey({ ...unit, kind });
        return {
          ...unit,
          key,
          kind,
          materialId: material.id,
          extraction: extractionOf.get(key) ?? null,
        };
      });
    }),
  );
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
