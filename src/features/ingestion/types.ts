export const CHUNK_LABELS = [
  "content",
  "exercise",
  "solution",
  "admin",
] as const;

export type ChunkLabel = (typeof CHUNK_LABELS)[number];

/** The kinds of unit a page batch gives: a heading, or a chunk's kind. */
export const UNIT_LABELS = [...CHUNK_LABELS, "heading"] as const;

export type UnitLabel = (typeof UNIT_LABELS)[number];

export const HEADING_STYLES = ["title", "large", "bold"] as const;

/** Why a parse stored a page without reading it (`material_pages.skipped`). */
export type PageSkip =
  "blank" | "overlay" | "unreadable" | "uncovered" | "titles";

export type ParseStatus =
  "not_parsed" | "queued" | "parsing" | "parsed" | "failed";

export type ChunkView = {
  id: string;
  position: number;
  pageFrom: number;
  pageTo: number;
  label: ChunkLabel;
  markdown: string;
  /** An exercise's solution; null for other chunks. */
  solution: ExerciseSolution | null;
};

/** The solution an exercise is paired with, possibly in another Material. */
export type ExerciseSolution =
  | {
      status: "paired";
      chunkId: string;
      materialId: string;
      materialName: string;
    }
  | { status: "no_solution" };

export type MaterialChunks = {
  materialId: string;
  courseId: string;
  name: string;
  parseStatus: ParseStatus;
  chunks: ChunkView[];
};
