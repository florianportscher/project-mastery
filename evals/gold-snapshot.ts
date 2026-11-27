import { randomUUID } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { z } from "zod";

/**
 * A gold Course's built content: what the pipeline stores for a Course
 * (Materials, Chapters, chunks, Knowledge map, Topics and the Brief),
 * without anything a Student did. `pnpm gold export` writes it
 * and `pnpm gold seed` loads it into a Student, so the tutor can be tried or
 * evaluated without running the pipeline again.
 */

type Parent = { table: string; column: string };

/**
 * The tables a snapshot holds, in the order they are inserted (parents first).
 * A table with `course_id` is read by it; one without it is read by `parent`.
 * Tables that a Student's activity fills (Chats, attempts, Memory, Problems,
 * mock exams and so on) are left out on purpose.
 */
export const SNAPSHOT_TABLES: { table: string; parent?: Parent }[] = [
  { table: "materials" },
  {
    table: "material_pages",
    parent: { table: "materials", column: "material_id" },
  },
  { table: "chunks" },
  { table: "unit_extractions" },
  { table: "knowledge_map_builds" },
  { table: "kcs" },
  { table: "kc_sources" },
  { table: "prerequisite_links" },
  { table: "exercises" },
  { table: "exercise_kcs" },
  { table: "exercise_chunks" },
  { table: "topics" },
  { table: "topic_kcs", parent: { table: "topics", column: "topic_id" } },
  { table: "briefs" },
  { table: "brief_excluded_materials" },
  { table: "exam_scopes" },
];

const rowSchema = z.record(z.string(), z.unknown());

const snapshotSchema = z.object({
  version: z.literal(1),
  /** The Course's name; a seed replaces a Course of the same name. */
  courseName: z.string(),
  courseId: z.string(),
  /** Written by snapshots from before #350; unused. */
  pairingRequested: z.number().optional(),
  tables: z.record(z.string(), z.array(rowSchema)),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
type Row = z.infer<typeof rowSchema>;

export function encodeSnapshot(snapshot: Snapshot) {
  return gzipSync(JSON.stringify(snapshot));
}

export function decodeSnapshot(bytes: Uint8Array) {
  return snapshotSchema.parse(JSON.parse(gunzipSync(bytes).toString("utf8")));
}

/** The file extension of an uploaded Material's media type. */
export function extensionOf(mediaType: string) {
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  return extensions[mediaType] ?? "bin";
}

/** `value` with every string in `ids` replaced, at any depth (jsonb included). */
function replaceIds(value: unknown, ids: Map<string, string>): unknown {
  if (typeof value === "string") return ids.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => replaceIds(v, ids));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, replaceIds(v, ids)]),
    );
  }
  return value;
}

/**
 * The snapshot's rows for a new Student and Course. Every row id gets a new
 * id, and each place that holds an old id (foreign keys, ids inside jsonb)
 * is rewritten to match; `owner`, `course_id` and each
 * Material's `storage_path` point at the new Student and Course. Returns the
 * new ids of the Materials by old id, which name the files to upload.
 */
export function remapSnapshot(
  snapshot: Snapshot,
  studentId: string,
  courseId: string,
) {
  const ids = new Map<string, string>([[snapshot.courseId, courseId]]);
  for (const rows of Object.values(snapshot.tables)) {
    for (const row of rows) {
      if (typeof row.id === "string") ids.set(row.id, randomUUID());
    }
  }

  const tables: Record<string, Row[]> = {};
  const current = reservedOnExams(
    withoutChapters(wholeExercises(snapshot.tables)),
  );
  for (const [table, rows] of Object.entries(current)) {
    tables[table] = rows.map((row) => {
      const next = replaceIds(row, ids) as Row;
      next.owner = studentId;
      if ("course_id" in next) next.course_id = courseId;
      if (table === "materials") {
        next.storage_path = `${studentId}/${courseId}/${next.id}`;
      }
      return next;
    });
  }

  const materialIds = Object.fromEntries(
    (snapshot.tables.materials ?? []).map((row) => [
      row.id as string,
      ids.get(row.id as string) as string,
    ]),
  );
  return { tables, materialIds };
}

/**
 * The tables of a snapshot from before Exercises were whole tasks (#350)
 * as the schema has them now: each Exercise's question and solution chunk
 * become its `exercise_chunks`, the pairs go, and so do the exercise
 * extractions, which the next Update map makes again.
 */
function wholeExercises(tables: Snapshot["tables"]): Snapshot["tables"] {
  const exercises = tables.exercises ?? [];
  if (!exercises.some((row) => "solution_chunk_id" in row)) return tables;
  const rest = Object.fromEntries(
    Object.entries(tables).filter(([name]) => name !== "exercise_solutions"),
  );
  const chunks: Row[] = [];
  const taken = new Set<unknown>();
  for (const role of ["question", "solution"] as const) {
    for (const exercise of exercises) {
      const chunkId =
        role === "question"
          ? exercise.question_chunk_id
          : exercise.solution_chunk_id;
      if (!chunkId || taken.has(chunkId)) continue;
      taken.add(chunkId);
      chunks.push({
        exercise_id: exercise.id,
        chunk_id: chunkId,
        role,
        position: 0,
        owner: exercise.owner,
        course_id: exercise.course_id,
      });
    }
  }
  return {
    ...rest,
    exercises: exercises.map((exercise) =>
      Object.fromEntries(
        Object.entries(exercise).filter(([key]) => key !== "solution_chunk_id"),
      ),
    ),
    exercise_chunks: chunks,
    chapter_extractions: (rest.chapter_extractions ?? []).filter(
      (row) => row.kind !== "exercise",
    ),
  };
}

function withoutKey(row: Row, key: string): Row {
  return Object.fromEntries(Object.entries(row).filter(([k]) => k !== key));
}

/**
 * The tables of a snapshot from before Chapters went (#351) as the schema
 * has them now, as the migration does it: each chunk's heading is its
 * Chapter's title (none under a root Chapter), the Chapters and the
 * extractions go, and the map needs an update to extract again.
 */
function withoutChapters(tables: Snapshot["tables"]): Snapshot["tables"] {
  if (!tables.chapters) return tables;
  const rest = Object.fromEntries(
    Object.entries(tables).filter(
      ([name]) => name !== "chapters" && name !== "chapter_extractions",
    ),
  );
  const chapters = tables.chapters;
  const titleOf = new Map(
    chapters
      .filter((chapter) => Number(chapter.depth) > 0)
      .map((chapter) => [chapter.id, chapter.title]),
  );
  return {
    ...rest,
    briefs: (rest.briefs ?? []).map((brief) =>
      withoutKey(brief, "reserved_exam_chapter_id"),
    ),
    topics: (rest.topics ?? []).map((topic) =>
      withoutKey(topic, "chapter_ids"),
    ),
    chunks: (rest.chunks ?? []).map(({ chapter_id, ...chunk }) => ({
      ...chunk,
      heading: titleOf.get(chapter_id) ?? null,
    })),
    knowledge_map_builds: (rest.knowledge_map_builds ?? []).map((build) => ({
      ...build,
      needs_update: true,
    })),
  };
}

/**
 * The tables of a snapshot from before an exam could be reserved on its own
 * (#412) as the schema has them now: the Brief's `reserved_exam_id` becomes
 * the exam's `reserved`.
 */
function reservedOnExams(tables: Snapshot["tables"]): Snapshot["tables"] {
  const briefs = tables.briefs ?? [];
  if (!briefs.some((brief) => "reserved_exam_id" in brief)) return tables;
  const reserved = new Set(briefs.map((brief) => brief.reserved_exam_id));
  return {
    ...tables,
    briefs: briefs.map((brief) => withoutKey(brief, "reserved_exam_id")),
    exams: (tables.exams ?? []).map((exam) => ({
      ...exam,
      reserved: reserved.has(exam.id) && exam.confirmed === true,
    })),
  };
}

/** The exam date a seeded Brief gets: `days` after `today`, as `YYYY-MM-DD`. */
export function examDateIn(days: number, today = new Date()) {
  const date = new Date(today.getTime() + days * 86_400_000);
  return date.toISOString().slice(0, 10);
}
