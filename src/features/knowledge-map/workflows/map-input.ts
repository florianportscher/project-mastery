import "server-only";
import { examChapterIds } from "@/features/ingestion/server";
import type { Link } from "@/features/knowledge-map/domain/prerequisite-cycles";
import { loadMapRows } from "@/features/knowledge-map/server/stored-map";
import { allRows } from "@/lib/supabase/all-rows";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The Course's map as the last steps of a build read it: its chunks in
 * Course order with their Chapters, its live KCs with their sources and the
 * Prerequisites between live KCs.
 */
export type MapInput = {
  /** In Course order: Materials by position, then chunks by position. */
  chunks: Array<{ id: string; chapterId: string | null; label: string }>;
  /** In Course order: Materials by position, then their Outlines in order. */
  chapters: Array<{
    id: string;
    materialId: string;
    title: string;
    depth: number;
    /** Whether it is in an old exam: a confirmed one or below one. */
    inExam: boolean;
  }>;
  /** The Course's Materials by position. */
  materials: Array<{ id: string; name: string }>;
  kcs: Array<{
    id: string;
    name: string;
    description: string;
    origin: string;
    sources: string[];
  }>;
  prerequisites: Link[];
  /** Each Exercise's live KCs. */
  exercises: string[][];
};

export async function loadMapInput(
  supabase: AdminSupabase,
  courseId: string,
): Promise<MapInput> {
  const [materials, chapters, chunks, rows] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position"),
    allRows("Loading the Chapters", (from, to) =>
      supabase
        .from("chapters")
        .select("id, material_id, parent_id, title, depth, is_exam")
        .eq("course_id", courseId)
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
    allRows("Loading the chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id, chapter_id, label, position")
        .eq("course_id", courseId)
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
    loadMapRows(supabase, courseId),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  const { kcs, sources, links, exerciseKcs: tested } = rows;

  const exams = examChapterIds(
    chapters.map((c) => ({
      id: c.id,
      parentId: c.parent_id,
      isExam: c.is_exam === true,
    })),
  );
  const sourcesOf = Map.groupBy(sources, (source) => source.kc_id);
  const live = new Set(kcs.map((kc) => kc.id));
  return {
    chunks: materials.data.flatMap((material) =>
      chunks
        .filter((chunk) => chunk.material_id === material.id)
        .map((chunk) => ({
          id: chunk.id,
          chapterId: chunk.chapter_id,
          label: chunk.label,
        })),
    ),
    chapters: materials.data.flatMap((material) =>
      chapters
        .filter((chapter) => chapter.material_id === material.id)
        .map((chapter) => ({
          id: chapter.id,
          materialId: chapter.material_id,
          title: chapter.title,
          depth: chapter.depth,
          inExam: exams.has(chapter.id),
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

/** Each live KC's first source's place in Course order. */
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
 * The live KCs with a first source in Course order, each with the title of
 * that source's Chapter (empty for a chunk without one).
 */
export function kcsInCourseOrder(
  map: MapInput,
): Array<{ id: string; chapter: string; name: string; description: string }> {
  const places = firstSourcePlaces(map);
  const titleOf = new Map(map.chapters.map((c) => [c.id, c.title]));
  const kcOf = new Map(map.kcs.map((kc) => [kc.id, kc]));
  return courseOrder(map).map((id) => {
    const kc = kcOf.get(id)!;
    const { chapterId } = map.chunks[places.get(id)!]!;
    return {
      id,
      chapter: (chapterId && titleOf.get(chapterId)) || "",
      name: kc.name,
      description: kc.description,
    };
  });
}

/** The live KCs with a first source, in Course order. */
export function courseOrder(map: MapInput): string[] {
  const places = firstSourcePlaces(map);
  return map.kcs
    .map((kc) => kc.id)
    .filter((id) => places.has(id))
    .toSorted((a, b) => places.get(a)! - places.get(b)!);
}
