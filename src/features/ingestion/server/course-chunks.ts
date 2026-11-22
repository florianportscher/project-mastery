import "server-only";
import { allRows } from "@/lib/supabase/all-rows";
import { failed } from "@/lib/supabase/failed";
import type { Supabase } from "@/lib/supabase/types";

export type ChunkSource = {
  id: string;
  materialId: string;
  materialName: string;
  pageFrom: number;
  pageTo: number;
  markdown: string;
  /** The heading it follows; null before its Material's first. */
  heading: string | null;
};

/**
 * The chunks among `chunkIds` that `supabase`, a Student's session client,
 * may read, in Course order: Materials by position, then chunks by
 * position. Deleted chunks are missing.
 */
export async function loadChunkSources(
  supabase: Supabase,
  chunkIds: string[],
): Promise<ChunkSource[]> {
  const ids = [...new Set(chunkIds)];
  const rows = [];
  // Ids go in the query string, so long lists are read in slices.
  for (let start = 0; start < ids.length; start += ID_SLICE) {
    const { data, error } = await supabase
      .from("chunks")
      .select(
        "id, material_id, position, page_from, page_to, markdown, heading",
      )
      .in("id", ids.slice(start, start + ID_SLICE));
    if (error) failed("Loading the chunks", error);
    rows.push(...data);
  }
  if (rows.length === 0) return [];

  const materialIds = [...new Set(rows.map((row) => row.material_id))];
  const materials = await supabase
    .from("materials")
    .select("id, name, position")
    .in("id", materialIds);
  if (materials.error) failed("Loading the Materials", materials.error);
  const material = new Map(materials.data.map((m) => [m.id, m]));
  return rows
    .filter((row) => material.has(row.material_id))
    .toSorted(
      (a, b) =>
        material.get(a.material_id)!.position -
          material.get(b.material_id)!.position || a.position - b.position,
    )
    .map((row) => ({
      id: row.id,
      materialId: row.material_id,
      materialName: material.get(row.material_id)!.name,
      pageFrom: row.page_from,
      pageTo: row.page_to,
      markdown: row.markdown,
      heading: row.heading,
    }));
}

/** Chunk ids per `in` filter, which keeps the query string short. */
const ID_SLICE = 100;

/** Where a chunk is in the Course, and its label, without its text. */
export type ChunkSpan = {
  id: string;
  materialId: string;
  materialName: string;
  pageFrom: number;
  pageTo: number;
  label: string;
};

/**
 * The places of every chunk of the Course's `parsed` Materials in Course
 * order: Materials by position, then chunks by position. Reads on the admin
 * client, or on a Student's session client, where Row Level Security scopes
 * it.
 */
export async function loadCourseChunkSpans(
  supabase: Supabase,
  courseId: string,
): Promise<ChunkSpan[]> {
  const materials = await supabase
    .from("materials")
    .select("id, name")
    .eq("course_id", courseId)
    .eq("parse_status", "parsed")
    .order("position");
  if (materials.error) failed("Loading the Materials", materials.error);

  const spans: ChunkSpan[] = [];
  for (const material of materials.data) {
    const rows = await allRows("Loading the chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("id, page_from, page_to, label")
        .eq("material_id", material.id)
        .order("position")
        .range(from, to),
    );
    for (const chunk of rows) {
      spans.push({
        id: chunk.id,
        materialId: material.id,
        materialName: material.name,
        pageFrom: chunk.page_from,
        pageTo: chunk.page_to,
        label: chunk.label,
      });
    }
  }
  return spans;
}

export type ChunkMaterials = {
  /** Each chunk's Material id by chunk id. */
  chunkMaterials: Record<string, string>;
  /** The Course's Materials' names by id. */
  materials: Record<string, { name: string }>;
};

/**
 * Every chunk of the Course with its Material, and the Course's Materials.
 * Scopes the reads to the Course, so it reads on the admin client or a
 * Student's session client alike.
 */
export async function loadChunkMaterials(
  supabase: Supabase,
  courseId: string,
): Promise<ChunkMaterials> {
  const [chunks, materials] = await Promise.all([
    allRows("Loading the chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id")
        .eq("course_id", courseId)
        .order("id")
        .range(from, to),
    ),
    supabase.from("materials").select("id, name").eq("course_id", courseId),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  return {
    chunkMaterials: Object.fromEntries(
      chunks.map((chunk) => [chunk.id, chunk.material_id]),
    ),
    materials: Object.fromEntries(
      materials.data.map((m) => [m.id, { name: m.name }]),
    ),
  };
}

/** An admin chunk: an organizational remark, such as "Chapter 2 is not examined". */
export type AdminChunk = {
  materialName: string;
  pageFrom: number;
  markdown: string;
};

/**
 * The Course's admin chunks in Course order: Materials by position, then
 * chunks by position. Scopes the reads to the Course, so it reads on the
 * admin client or a Student's session client alike.
 */
export async function loadAdminChunks(
  supabase: Supabase,
  courseId: string,
): Promise<AdminChunk[]> {
  const [materials, chunks] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position"),
    allRows("Loading the admin chunks", (from, to) =>
      supabase
        .from("chunks")
        .select("material_id, position, page_from, markdown")
        .eq("course_id", courseId)
        .eq("label", "admin")
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  return materials.data.flatMap((material) =>
    chunks
      .filter((chunk) => chunk.material_id === material.id)
      .map((chunk) => ({
        materialName: material.name,
        pageFrom: chunk.page_from,
        markdown: chunk.markdown,
      })),
  );
}
