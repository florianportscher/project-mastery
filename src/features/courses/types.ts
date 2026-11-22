import type { ParseState } from "@/features/ingestion";

export type CourseListItem = {
  id: string;
  name: string;
};

export type MaterialListItem = {
  id: string;
  name: string;
  mediaType: string;
  sizeBytes: number;
  /** When it was uploaded, as an ISO timestamp. */
  createdAt: string;
  /** How far its parse is. */
  parse: ParseState;
};

export type StoredMaterial = {
  id: string;
  courseId: string;
  name: string;
  mediaType: string;
  sizeBytes: number;
  storagePath: string;
};

/** A Course in the Course list, with what deleting it takes along. */
export type CourseWithCounts = CourseListItem & {
  /** How many Chats the Course holds. */
  chatCount: number;
  /** How many Materials the Course holds. */
  materialCount: number;
};
