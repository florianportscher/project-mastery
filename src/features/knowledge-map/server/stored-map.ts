import "server-only";
import {
  kcAssumesSchema,
  knowledgeMapSchema,
  type KnowledgeMap,
} from "@/features/knowledge-map/schemas";
import { allRows } from "@/lib/supabase/all-rows";
import type { Supabase } from "@/lib/supabase/types";

/**
 * A Course's stored Knowledge map, with stored row ids as its ids. The Chat,
 * the plan and the workflows read it.
 */

/**
 * What each live KC of the Course assumes from outside it (`kcs.assumes`),
 * by KC id; KCs that assume nothing are left out.
 */
export async function loadKcAssumes(
  supabase: Supabase,
  courseId: string,
): Promise<Map<string, Array<{ name: string; description: string }>>> {
  const rows = await allRows("Loading what the KCs assume", (from, to) =>
    supabase
      .from("kcs")
      .select("id, assumes")
      .eq("course_id", courseId)
      .is("retired_at", null)
      .order("id")
      .range(from, to),
  );
  return new Map(
    rows.flatMap((row) => {
      const assumes = kcAssumesSchema.safeParse(row.assumes);
      return assumes.success && assumes.data.length > 0
        ? [[row.id, assumes.data] as const]
        : [];
    }),
  );
}

/**
 * The question and solution chunks of an exam's Exercises: for a reserved
 * old exam, the chunks it hides. Empty when the exam is gone. Reads on the
 * admin client or a Student's session client, where Row Level Security
 * leaves another Student's out.
 */
export async function loadExamChunkIds(
  supabase: Supabase,
  examId: string,
): Promise<string[]> {
  const exercises = await allRows("Loading the exam's Exercises", (from, to) =>
    supabase
      .from("exercises")
      .select("id")
      .eq("exam_id", examId)
      .order("id")
      .range(from, to),
  );
  const ids = exercises.map(({ id }) => id);
  const chunks: string[] = [];
  // Ids go in the query string, so long lists are read in slices.
  for (let start = 0; start < ids.length; start += 100) {
    const rows = await allRows("Loading the exam's chunks", (from, to) =>
      supabase
        .from("exercise_chunks")
        .select("chunk_id")
        .in("exercise_id", ids.slice(start, start + 100))
        .order("chunk_id")
        .range(from, to),
    );
    chunks.push(...rows.map(({ chunk_id }) => chunk_id));
  }
  return chunks;
}

/**
 * The rows of a Course's map: its live KCs in order, their sources, the
 * Prerequisite links (also those of retired KCs), the Exercises, the KCs
 * each tests and their chunks. One read for the stored map, the map queries
 * and the build.
 */
export async function loadMapRows(supabase: Supabase, courseId: string) {
  const [kcs, sources, links, exercises, exerciseKcs, exerciseChunks] =
    await Promise.all([
      allRows("Loading the KCs", (from, to) =>
        supabase
          .from("kcs")
          .select("id, name, description, origin")
          .eq("course_id", courseId)
          .is("retired_at", null)
          .order("position")
          .order("id")
          .range(from, to),
      ),
      allRows("Loading the KC sources", (from, to) =>
        supabase
          .from("kc_sources")
          .select("kc_id, chunk_id")
          .eq("course_id", courseId)
          .order("kc_id")
          .order("chunk_id")
          .range(from, to),
      ),
      allRows("Loading the prerequisites", (from, to) =>
        supabase
          .from("prerequisite_links")
          .select("from_kc, to_kc")
          .eq("course_id", courseId)
          .order("from_kc")
          .order("to_kc")
          .range(from, to),
      ),
      allRows("Loading the exercises", (from, to) =>
        supabase
          .from("exercises")
          .select("id, question_chunk_id, difficulty, final_answers, exam_id")
          .eq("course_id", courseId)
          .order("position")
          .order("id")
          .range(from, to),
      ),
      allRows("Loading the exercise KCs", (from, to) =>
        supabase
          .from("exercise_kcs")
          .select("exercise_id, kc_id")
          .eq("course_id", courseId)
          .order("exercise_id")
          .order("kc_id")
          .range(from, to),
      ),
      allRows("Loading the exercise chunks", (from, to) =>
        supabase
          .from("exercise_chunks")
          .select("exercise_id, chunk_id, role, position")
          .eq("course_id", courseId)
          .order("exercise_id")
          .order("chunk_id")
          .range(from, to),
      ),
    ]);
  return { kcs, sources, links, exercises, exerciseKcs, exerciseChunks };
}

/**
 * The Course's stored map, with its rows' ids; empty before the first. Reads
 * on the admin client or a Student's session client, where Row Level
 * Security leaves another Student's Course empty.
 */
export async function loadStoredMap(
  supabase: Supabase,
  courseId: string,
): Promise<KnowledgeMap> {
  const [rows, confirmedExams] = await Promise.all([
    loadMapRows(supabase, courseId),
    allRows("Loading the old exams", (from, to) =>
      supabase
        .from("exams")
        .select("id")
        .eq("course_id", courseId)
        .eq("confirmed", true)
        .order("id")
        .range(from, to),
    ),
  ]);
  const {
    kcs,
    sources,
    links: prerequisites,
    exercises,
    exerciseKcs,
    exerciseChunks,
  } = rows;
  const oldExams = new Set(confirmedExams.map(({ id }) => id));

  const chunksOf = (exerciseId: string, role: "question" | "solution") =>
    exerciseChunks
      .filter((row) => row.exercise_id === exerciseId && row.role === role)
      .toSorted((a, b) => a.position - b.position)
      .map((row) => row.chunk_id);
  const kcOrder = new Map(kcs.map((kc, index) => [kc.id, index]));
  return knowledgeMapSchema.parse({
    kcs: kcs.map((kc) => ({
      id: kc.id,
      name: kc.name,
      description: kc.description,
      origin: kc.origin,
      sources: sources
        .filter((source) => source.kc_id === kc.id)
        .map((source) => source.chunk_id),
    })),
    // A retired KC is out of the map, with its links.
    prerequisites: prerequisites
      .filter((link) => kcOrder.has(link.from_kc) && kcOrder.has(link.to_kc))
      .map((link) => ({ from: link.from_kc, to: link.to_kc })),
    exercises: exercises.map((exercise) => {
      const questions = chunksOf(exercise.id, "question");
      return {
        id: exercise.id,
        questionChunk: exercise.question_chunk_id,
        // An Exercise from before its chunks were stored has its first one.
        questionChunks:
          questions.length > 0 ? questions : [exercise.question_chunk_id],
        solutionChunks: chunksOf(exercise.id, "solution"),
        difficulty: exercise.difficulty,
        kcs: exerciseKcs
          .filter(
            (link) =>
              link.exercise_id === exercise.id && kcOrder.has(link.kc_id),
          )
          .map((link) => link.kc_id)
          .toSorted((a, b) => (kcOrder.get(a) ?? 0) - (kcOrder.get(b) ?? 0)),
        finalAnswers: exercise.final_answers,
        examId: exercise.exam_id,
        oldExam: oldExams.has(exercise.exam_id ?? ""),
      };
    }),
  });
}
