import { createHash } from "node:crypto";

/**
 * Exercises as whole tasks (#350), the part done in code: which exercise
 * and solution chunks each grouping call sees and by which short ids, the
 * checks on its answer, and how Exercises are packed into the batches of
 * the exercise extraction.
 */

/** An exercise or solution chunk of a Course, as the grouping sees it. */
export type GroupingChunk = { id: string; label: "exercise" | "solution" };

/** One Exercise: its question and solution chunks, each in Course order. */
export type ExerciseGroup = {
  questionChunkIds: string[];
  solutionChunkIds: string[];
};

/** The most exercise and solution chunks one grouping call sees. */
export const MAX_GROUPING_CHUNKS = 400;

/**
 * The chunks of each grouping call: the Course's exercise and solution
 * chunks in Course order, in runs of at most `size`. A run without an
 * exercise chunk needs no call and is left out.
 */
export function groupingRuns<Chunk extends GroupingChunk>(
  chunks: readonly Chunk[],
  size = MAX_GROUPING_CHUNKS,
): Chunk[][] {
  const runs: Chunk[][] = [];
  for (let start = 0; start < chunks.length; start += size) {
    runs.push(chunks.slice(start, start + size));
  }
  return runs.filter((run) => run.some((chunk) => chunk.label === "exercise"));
}

/**
 * The ids a call sees its chunks by: e1, e2, … for the exercise chunks and
 * s1, s2, … for the solution chunks, in order. Maps each to its chunk.
 */
export function offeredIds<Chunk extends GroupingChunk>(
  chunks: readonly Chunk[],
): Map<string, Chunk> {
  const offered = new Map<string, Chunk>();
  let exercises = 0;
  let solutions = 0;
  for (const chunk of chunks) {
    const id =
      chunk.label === "exercise" ? `e${++exercises}` : `s${++solutions}`;
    offered.set(id, chunk);
  }
  return offered;
}

/** An Exercise as the call answers it, by offered ids. */
export type AnsweredExercise = { questionIds: string[]; solutionIds: string[] };

/**
 * The Exercises of one run, from the call's answer: an id that names no
 * offered chunk of the right label is dropped, a chunk belongs to the first
 * Exercise that names it, an Exercise left without a question chunk goes,
 * and an exercise chunk the answer left out becomes an Exercise of its own.
 * Exercises come in Course order, each one's chunks too.
 */
export function checkedGroups(
  answer: readonly AnsweredExercise[],
  offered: ReadonlyMap<string, GroupingChunk>,
): ExerciseGroup[] {
  const order = new Map([...offered.values()].map((c, i) => [c.id, i]));
  const taken = new Set<string>();
  const take = (ids: readonly string[], label: GroupingChunk["label"]) => {
    const chunkIds: string[] = [];
    for (const id of ids) {
      const chunk = offered.get(id.trim());
      if (chunk?.label !== label || taken.has(chunk.id)) continue;
      taken.add(chunk.id);
      chunkIds.push(chunk.id);
    }
    return chunkIds.toSorted((a, b) => order.get(a)! - order.get(b)!);
  };
  const groups: ExerciseGroup[] = [];
  for (const exercise of answer) {
    const questionChunkIds = take(exercise.questionIds, "exercise");
    if (questionChunkIds.length === 0) continue;
    groups.push({
      questionChunkIds,
      solutionChunkIds: take(exercise.solutionIds, "solution"),
    });
  }
  for (const chunk of offered.values()) {
    if (chunk.label === "exercise" && !taken.has(chunk.id)) {
      groups.push({ questionChunkIds: [chunk.id], solutionChunkIds: [] });
    }
  }
  return groups.toSorted(
    (a, b) =>
      order.get(a.questionChunkIds[0]!)! - order.get(b.questionChunkIds[0]!)!,
  );
}

/** Each exercise chunk of the run as an Exercise of its own, without a solution. */
export function ownGroups(chunks: readonly GroupingChunk[]): ExerciseGroup[] {
  return chunks
    .filter((chunk) => chunk.label === "exercise")
    .map((chunk) => ({ questionChunkIds: [chunk.id], solutionChunkIds: [] }));
}

/** What the grouping is made from: the chunks' ids and labels, in order. */
export function groupingHash(chunks: readonly GroupingChunk[]): string {
  return createHash("sha256")
    .update(chunks.map((chunk) => `${chunk.label}:${chunk.id}`).join("\n"))
    .digest("hex");
}

/**
 * Exercises in Course order packed into batches of at most `cap`
 * characters (statements and solutions), a batch never spanning two
 * Materials. An Exercise bigger than the cap is a batch of its own.
 */
export function exerciseBatches<
  Exercise extends { material: string; chars: number },
>(exercises: readonly Exercise[], cap: number): Exercise[][] {
  const batches: Exercise[][] = [];
  let chars = 0;
  for (const exercise of exercises) {
    const last = batches.at(-1);
    if (
      last &&
      last[0]!.material === exercise.material &&
      chars + exercise.chars <= cap
    ) {
      last.push(exercise);
      chars += exercise.chars;
    } else {
      batches.push([exercise]);
      chars = exercise.chars;
    }
  }
  return batches;
}

/** A Chapter of a Material's Outline, as a Chapter path reads it. */
export type PathChapter = {
  parentId: string | null;
  depth: number;
  title: string;
};

/**
 * The titles from the top Chapter below the root down to this one, such as
 * ["4 Vector Spaces", "4.2 Subspaces"]; empty for the root or no Chapter.
 */
export function chapterPath(
  chapterId: string | null,
  chapters: ReadonlyMap<string, PathChapter>,
): string[] {
  const titles: string[] = [];
  const seen = new Set<string>();
  let id = chapterId;
  while (id !== null && !seen.has(id)) {
    seen.add(id);
    const chapter = chapters.get(id);
    if (!chapter || chapter.depth === 0) break;
    titles.unshift(chapter.title);
    id = chapter.parentId;
  }
  return titles;
}
