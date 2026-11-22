import "server-only";
import type { Link } from "@/features/knowledge-map/domain/prerequisite-cycles";
import { loadMapRows } from "@/features/knowledge-map/server/stored-map";
import { allRows } from "@/lib/supabase/all-rows";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The Course's map as the last steps of a build read it: its chunks in
 * Course order with their headings, its live KCs with their sources and the
 * Prerequisites between live KCs.
 */
export type MapInput = {
  /** In Course order: Materials by position, then chunks by position. */
  chunks: Array<{
    id: string;
    materialId: string;
    heading: string | null;
    label: string;
    pageFrom: number;
    pageTo: number;
  }>;
  materials: Array<{ id: string; name: string }>;
  kcs: Array<{
    id: string;
    name: string;
    description: string;
    origin: string;
    sources: string[];
  }>;
  prerequisites: Link[];
  exercises: string[][];
};

export async function loadMapInput(
  supabase: AdminSupabase,
  courseId: string,
): Promise<MapInput> {
  const [materials, chunks, rows] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position"),
    allRows("Loading the chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id, heading, label, position, page_from, page_to")
        .eq("course_id", courseId)
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
    loadMapRows(supabase, courseId),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  const { kcs, sources, links, exerciseKcs: tested } = rows;

  const sourcesOf = Map.groupBy(sources, (source) => source.kc_id);
  const live = new Set(kcs.map((kc) => kc.id));
  return {
    chunks: materials.data.flatMap((material) =>
      chunks
        .filter((chunk) => chunk.material_id === material.id)
        .map((chunk) => ({
          id: chunk.id,
          materialId: chunk.material_id,
          heading: chunk.heading,
          label: chunk.label,
          pageFrom: chunk.page_from,
          pageTo: chunk.page_to,
        })),
    ),
    materials: materials.data,
    exercises: [
      ...Map.groupBy(
        tested.filter((row) => live.has(row.kc_id)),
        (row) => row.exercise_id,
      ).values(),
    ].map((rows) => rows.map((row) => row.kc_id)),
    kcs: kcs.map((kc) => ({
      ...kc,
      sources: (sourcesOf.get(kc.id) ?? []).map((source) => source.chunk_id),
    })),
    prerequisites: links
      .filter((link) => live.has(link.from_kc) && live.has(link.to_kc))
      .map((link) => ({ from: link.from_kc, to: link.to_kc })),
  };
}

export function firstSourcePlaces(map: MapInput): Map<string, number> {
  const place = new Map(map.chunks.map((chunk, index) => [chunk.id, index]));
  return new Map(
    map.kcs.flatMap((kc) => {
      const places = kc.sources.flatMap((id) => place.get(id) ?? []);
      return places.length === 0 ? [] : [[kc.id, Math.min(...places)]];
    }),
  );
}

/**
 * The live KCs with a first source in Course order, each with the heading
 * that source follows (empty without one) and its Material's name.
 */
export function kcsInCourseOrder(map: MapInput): Array<{
  id: string;
  heading: string;
  material: string;
  name: string;
  description: string;
}> {
  const places = firstSourcePlaces(map);
  const materialOf = new Map(map.materials.map((m) => [m.id, m.name]));
  const kcOf = new Map(map.kcs.map((kc) => [kc.id, kc]));
  return courseOrder(map).map((id) => {
    const kc = kcOf.get(id)!;
    const { heading, materialId } = map.chunks[places.get(id)!]!;
    return {
      id,
      heading: heading ?? "",
      material: materialOf.get(materialId) ?? "",
      name: kc.name,
      description: kc.description,
    };
  });
}

function courseOrder(map: MapInput): string[] {
  const places = firstSourcePlaces(map);
  return map.kcs
    .map((kc) => kc.id)
    .filter((id) => places.has(id))
    .toSorted((a, b) => places.get(a)! - places.get(b)!);
}
