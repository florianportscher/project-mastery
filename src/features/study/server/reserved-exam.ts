import "server-only";
import { getReservedExams } from "@/features/brief/server";
import { loadExamChunkIds } from "@/features/knowledge-map/server";
import type { Supabase } from "@/lib/supabase/types";

/**
 * The chunks of the Course's active reserved exams' Exercises, questions
 * and solutions, which the tutor and problem generation leave out: its
 * Exercises (by question chunk), search results, source chunks and Reading
 * sections. Empty without a reservation. Reads on a Student's session
 * client or the admin client.
 */
export async function loadReservedChunks(
  supabase: Supabase,
  courseId: string,
): Promise<Set<string>> {
  const examIds = await getReservedExams(supabase, courseId);
  const chunks = await Promise.all(
    examIds.map((examId) => loadExamChunkIds(supabase, examId)),
  );
  return new Set(chunks.flatMap((ids) => [...ids]));
}

export function withoutReserved<Map extends { exercises: Exercise[] }>(
  map: Map,
  reserved: Set<string>,
): Map {
  if (reserved.size === 0) return map;
  return {
    ...map,
    exercises: map.exercises.filter((e) => !reserved.has(e.questionChunk)),
  };
}

type Exercise = { questionChunk: string };

/**
 * The Reading sections by Topic without those that show a reserved chunk.
 * A section cuts pages of one Material, so this leaves out the reserved
 * exam's sections.
 */
export function withoutReservedSections<Section extends { chunkIds: string[] }>(
  sections: Map<string, Section[]>,
  reserved: Set<string>,
): Map<string, Section[]> {
  if (reserved.size === 0) return sections;
  return new Map(
    [...sections].map(([topicId, list]) => [
      topicId,
      list.filter(({ chunkIds }) => !chunkIds.some((id) => reserved.has(id))),
    ]),
  );
}
