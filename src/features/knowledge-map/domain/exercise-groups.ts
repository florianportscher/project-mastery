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
  /** The stored exam it belongs to; null or missing for none. */
  examId?: string | null;
};

/** An Exercise of one grouping call, with the name of its exam. */
export type CheckedGroup = Omit<ExerciseGroup, "examId"> & {
  /** One of the call's exams, by name; null for none. */
  exam: string | null;
};

/** An exam a grouping call found, with the stored exam it continues. */
export type FoundExam = { name: string; storedId: string | null };

/** The most exercise and solution chunks one grouping call sees. */
const MAX_GROUPING_CHUNKS = 400;

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
export type AnsweredExercise = {
  questionIds: string[];
  solutionIds: string[];
  exam?: string | null;
};

/**
 * The Exercises of one run, from the call's answer: an id that names no
 * offered chunk of the right label is dropped, a chunk belongs to the first
 * Exercise that names it, an Exercise left without a question chunk goes,
 * and an exercise chunk the answer left out becomes an Exercise of its own.
 * An exam name not among `examNames` means no exam. Exercises come in
 * Course order, each one's chunks too.
 */
export function checkedGroups(
  answer: readonly AnsweredExercise[],
  offered: ReadonlyMap<string, GroupingChunk>,
  examNames: ReadonlySet<string> = new Set(),
): CheckedGroup[] {
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
  const groups: CheckedGroup[] = [];
  for (const exercise of answer) {
    const questionChunkIds = take(exercise.questionIds, "exercise");
    if (questionChunkIds.length === 0) continue;
    const exam = exercise.exam?.trim() ?? "";
    groups.push({
      questionChunkIds,
      solutionChunkIds: take(exercise.solutionIds, "solution"),
      exam: examNames.has(exam) ? exam : null,
    });
  }
  for (const chunk of offered.values()) {
    if (chunk.label === "exercise" && !taken.has(chunk.id)) {
      groups.push({
        questionChunkIds: [chunk.id],
        solutionChunkIds: [],
        exam: null,
      });
    }
  }
  return groups.toSorted(
    (a, b) =>
      order.get(a.questionChunkIds[0]!)! - order.get(b.questionChunkIds[0]!)!,
  );
}

/** Each exercise chunk of the run as an Exercise of its own, without a solution. */
export function ownGroups(chunks: readonly GroupingChunk[]): CheckedGroup[] {
  return chunks
    .filter((chunk) => chunk.label === "exercise")
    .map((chunk) => ({
      questionChunkIds: [chunk.id],
      solutionChunkIds: [],
      exam: null,
    }));
}

/** An exam as the call answers it: its printed name, the stored id it continues. */
export type AnsweredExam = { name: string; continues?: string | null };

/**
 * The exams of one run, from the call's answer: names trimmed, an empty or
 * repeated name dropped, and `continues` turned into the stored exam's id
 * when it names one of `stored` (offered id to stored id) that no earlier
 * exam continues; otherwise the exam is new.
 */
export function checkedExams(
  answer: readonly AnsweredExam[],
  stored: ReadonlyMap<string, string>,
): FoundExam[] {
  const exams: FoundExam[] = [];
  for (const exam of answer) {
    const name = exam.name.trim();
    if (name === "" || exams.some((e) => e.name === name)) continue;
    const storedId = stored.get(exam.continues?.trim() ?? "") ?? null;
    const taken = exams.some(
      (e) => e.storedId !== null && e.storedId === storedId,
    );
    exams.push({ name, storedId: taken ? null : storedId });
  }
  return exams;
}

/**
 * The Course's exams from every run's Exercises, in Course order of their
 * first Exercise, with each Exercise's exam as an index into them. Two runs'
 * exams are one when they continue the same stored exam or have the same
 * name. An exam without an Exercise is left out.
 */
export function courseExams(
  runs: ReadonlyArray<{ groups: CheckedGroup[]; exams: FoundExam[] }>,
): {
  exams: FoundExam[];
  groups: Array<Omit<CheckedGroup, "exam"> & { exam: number | null }>;
} {
  const exams: FoundExam[] = [];
  const groups = runs.flatMap((run) =>
    run.groups.map(({ exam: name, ...group }) => {
      const found = run.exams.find((e) => e.name === name);
      if (!found) return { ...group, exam: null };
      let index = exams.findIndex(
        (e) =>
          (found.storedId !== null && e.storedId === found.storedId) ||
          e.name === found.name,
      );
      if (index === -1) index = exams.push({ ...found }) - 1;
      else exams[index]!.storedId ??= found.storedId;
      return { ...group, exam: index };
    }),
  );
  return { exams, groups };
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
