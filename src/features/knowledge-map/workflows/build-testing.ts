import { cosineSimilarity } from "@/features/knowledge-map/domain/kc-clusters";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";

export {
  flatTree,
  unitHeadings,
  useBuildModels,
  type SentCourse,
  type SentUnit,
} from "./build-models-testing";

/**
 * Test helpers for the build workflow in-process (`build-knowledge-map.ts`):
 * the admin client as a `fakeSupabase` whose database functions stand in
 * for the real ones, which pgTAP tests, and seeded Materials with their
 * chunks. The mock models are in `build-models-testing.ts`. Each test
 * file mocks `@/lib/supabase/admin` with its own `db`.
 */

export const STUDENT = "11111111-1111-1111-1111-111111111111";
export const COURSE = "aaaaaaaa-c000-4000-8000-000000000001";

type Tables = Record<string, FakeRow[]>;

const building = (tables: Tables, courseId: unknown) =>
  tables.knowledge_map_builds!.find(
    (row) => row.course_id === courseId && row.status === "building",
  );

const vectorOf = (text: unknown) => JSON.parse(String(text)) as number[];

/** The time, a millisecond later than the last call's at least. */
let last = 0;
const now = () => {
  last = Math.max(Date.now(), last + 1);
  return new Date(last).toISOString();
};

export function createBuildDb() {
  return fakeSupabase({
    tables: {
      courses: [] as FakeRow[],
      materials: [] as FakeRow[],
      material_pages: [] as FakeRow[],
      chunks: [] as FakeRow[],
      knowledge_map_builds: [] as FakeRow[],
      unit_extractions: [] as FakeRow[],
      kcs: [] as FakeRow[],
      kc_sources: [] as FakeRow[],
      prerequisite_links: [] as FakeRow[],
      exams: [] as FakeRow[],
      exercises: [] as FakeRow[],
      exercise_kcs: [] as FakeRow[],
      exercise_chunks: [] as FakeRow[],
      attempts: [] as FakeRow[],
      topics: [] as FakeRow[],
      topic_kcs: [] as FakeRow[],
      ai_usage: [] as FakeRow[],
    },
    foreignKeys: { topic_kcs: { topic_id: "topics" } },
    defaults: {
      ai_usage: () => ({ created_at: now() }),
      unit_extractions: () => ({ id: crypto.randomUUID() }),
      exams: () => ({ id: crypto.randomUUID(), confirmed: null, asked: false }),
    },
    functions: {
      set_exercise_exams: (args, tables) => {
        const listed = args.p_exercises as Array<{
          questionChunkId: string;
          examId: string | null;
        }>;
        const examOf = new Map(
          listed.map((x) => [
            x.questionChunkId,
            tables.exams.some(
              (e) => e.id === x.examId && e.course_id === args.p_course_id,
            )
              ? x.examId
              : null,
          ]),
        );
        for (const exercise of tables.exercises) {
          if (exercise.course_id !== args.p_course_id) continue;
          exercise.exam_id =
            examOf.get(exercise.question_chunk_id as string) ?? null;
        }
        return null;
      },
      retire_unsourced_kcs: (args, tables) => {
        const retired = tables.kcs.filter(
          (kc) =>
            kc.course_id === args.p_course_id &&
            !kc.retired_at &&
            !tables.kc_sources.some((source) => source.kc_id === kc.id),
        );
        for (const kc of retired) kc.retired_at = now();
        return retired.length;
      },
      match_kcs: (args, tables) => {
        const embedding = vectorOf(args.p_embedding);
        return tables.kcs
          .filter(
            (kc) =>
              kc.course_id === args.p_course_id &&
              kc.embedding &&
              Boolean(kc.retired_at) === Boolean(args.p_retired),
          )
          .map((kc) => ({
            id: kc.id,
            similarity: cosineSimilarity(vectorOf(kc.embedding), embedding),
          }))
          .toSorted((a, b) => b.similarity - a.similarity)
          .slice(0, Number(args.p_count));
      },
      store_unit_kcs: (args, tables) => {
        const build = building(tables, args.p_course_id);
        if (!build) return false;
        const owned = { owner: build.owner, course_id: args.p_course_id };
        const exerciseUnits = (args.p_units as FakeRow[]).filter(
          (unit) => unit.exercises,
        );
        for (const unit of exerciseUnits) {
          const chunks = new Set(unit.chunkIds as string[]);
          tables.kc_sources = tables.kc_sources.filter(
            (source) => !chunks.has(source.chunk_id as string),
          );
        }
        for (const kc of args.p_kcs as FakeRow[]) {
          if (kc.new) {
            tables.kcs.push({
              ...owned,
              id: kc.id,
              name: kc.name,
              description: kc.description,
              origin: kc.origin ?? "content",
              position: tables.kcs.length,
              embedding: kc.embedding,
              assumes: [],
              retired_at: null,
              created_at: now(),
            });
          } else {
            const stored = tables.kcs.find((row) => row.id === kc.id);
            if (stored?.retired_at) stored.retired_at = null;
          }
          for (const chunkId of kc.sources as string[]) {
            const known =
              tables.chunks.some((chunk) => chunk.id === chunkId) &&
              !tables.kc_sources.some(
                (row) => row.kc_id === kc.id && row.chunk_id === chunkId,
              );
            if (known) {
              tables.kc_sources.push({
                ...owned,
                kc_id: kc.id,
                chunk_id: chunkId,
              });
            }
          }
        }
        for (const link of args.p_prerequisites as FakeRow[]) {
          tables.prerequisite_links.push({
            ...owned,
            from_kc: link.from,
            to_kc: link.to,
          });
        }
        for (const unit of exerciseUnits) {
          const chunks = new Set(unit.chunkIds as string[]);
          const listed = unit.exercises as FakeRow[];
          tables.exercises = tables.exercises.filter(
            (row) =>
              !chunks.has(row.question_chunk_id as string) ||
              listed.some((x) => x.questionChunkId === row.question_chunk_id),
          );
          for (const x of listed) {
            const answers = x.finalAnswers as unknown[];
            const values = {
              difficulty: x.difficulty,
              final_answers: answers.length > 0 ? answers : null,
            };
            let row = tables.exercises.find(
              (e) => e.question_chunk_id === x.questionChunkId,
            );
            if (row) Object.assign(row, values);
            else {
              row = {
                ...owned,
                id: crypto.randomUUID(),
                question_chunk_id: x.questionChunkId,
                position: tables.exercises.length,
                ...values,
              };
              tables.exercises.push(row);
            }
            const exerciseId = row.id;
            // Its chunks replace what it and they held.
            const members = [
              ...(x.questionChunkIds as string[]).map((id, position) => ({
                id,
                role: "question",
                position,
              })),
              ...(x.solutionChunkIds as string[]).map((id, position) => ({
                id,
                role: "solution",
                position,
              })),
            ].filter((m) => tables.chunks.some((chunk) => chunk.id === m.id));
            tables.exercise_chunks = [
              ...tables.exercise_chunks.filter(
                (ec) =>
                  ec.exercise_id !== exerciseId &&
                  !members.some((m) => m.id === ec.chunk_id),
              ),
              ...members.map((m) => ({
                ...owned,
                exercise_id: exerciseId,
                chunk_id: m.id,
                role: m.role,
                position: m.position,
              })),
            ];
            tables.exercise_kcs = [
              ...tables.exercise_kcs.filter(
                (link) => link.exercise_id !== exerciseId,
              ),
              ...(x.kcIds as string[]).map((kcId) => ({
                ...owned,
                exercise_id: exerciseId,
                kc_id: kcId,
              })),
            ];
          }
        }
        for (const unit of args.p_units as FakeRow[]) {
          const row = tables.unit_extractions.find(
            (extraction) => extraction.id === unit.extractionId,
          );
          if (!row) continue;
          const output = row.output as { kcs: FakeRow[] };
          row.kc_ids = unit.kcIds;
          row.output = {
            ...output,
            kcs: output.kcs.map((kc) => ({ ...kc, embedding: undefined })),
          };
        }
        build.heartbeat_at = now();
        return true;
      },
      store_assumed_prerequisites: (args, tables) => {
        const build = building(tables, args.p_course_id);
        if (!build) return false;
        const key = (name: unknown) => String(name).trim().toLowerCase();
        for (const matched of args.p_matched as FakeRow[]) {
          const kc = tables.kcs.find((row) => row.id === matched.kc)!;
          kc.assumes = (kc.assumes as FakeRow[]).filter(
            (entry) => key(entry.name) !== key(matched.name),
          );
        }
        for (const entry of args.p_assumes as FakeRow[]) {
          const kc = tables.kcs.find((row) => row.id === entry.kc)!;
          const assumes = kc.assumes as FakeRow[];
          if (!assumes.some((other) => key(other.name) === key(entry.name))) {
            kc.assumes = [
              ...assumes,
              {
                name: String(entry.name).trim(),
                description: entry.description,
              },
            ];
          }
        }
        for (const link of args.p_prerequisites as FakeRow[]) {
          tables.prerequisite_links.push({
            owner: build.owner,
            course_id: args.p_course_id,
            from_kc: link.from,
            to_kc: link.to,
          });
        }
        const ids = args.p_extraction_ids as string[];
        for (const row of tables.unit_extractions) {
          if (ids.includes(row.id as string)) row.assumes_matched = true;
        }
        return true;
      },
      alike_kcs: (args, tables) => {
        const live = tables.kcs.filter(
          (kc) =>
            kc.course_id === args.p_course_id && !kc.retired_at && kc.embedding,
        );
        return live
          .flatMap((a, i) =>
            live.slice(i + 1).map((b) => ({
              a: a.id,
              b: b.id,
              similarity: cosineSimilarity(
                vectorOf(a.embedding),
                vectorOf(b.embedding),
              ),
            })),
          )
          .filter((pair) => pair.similarity >= Number(args.p_similarity));
      },
      arrange_knowledge_map: (args, tables) => {
        const build = building(tables, args.p_course_id);
        if (!build) return false;
        const dropped = args.p_dropped_prerequisites as FakeRow[];
        tables.prerequisite_links = tables.prerequisite_links.filter(
          (link) =>
            !dropped.some(
              (drop) => drop.from === link.from_kc && drop.to === link.to_kc,
            ),
        );
        const order = args.p_kcs as string[];
        for (const kc of tables.kcs) {
          const index = order.indexOf(kc.id as string);
          kc.position = index < 0 ? order.length + Number(kc.position) : index;
        }
        // The Topic tree: continued ids kept, the others new.
        const planned = args.p_topics as FakeRow[];
        const ids = planned.map((topic) =>
          tables.topics.some((row) => row.id === topic.id)
            ? (topic.id as string)
            : crypto.randomUUID(),
        );
        tables.topics = planned.map((topic, index) => ({
          id: ids[index],
          owner: build.owner,
          course_id: args.p_course_id,
          parent_id: topic.parent === null ? null : ids[topic.parent as number],
          name: topic.name,
          central_question: topic.centralQuestion,
          position: index,
        }));
        tables.topic_kcs = planned.flatMap((topic, index) =>
          (topic.kcs as string[]).map((kcId, position) => ({
            topic_id: ids[index],
            kc_id: kcId,
            owner: build.owner,
            position,
          })),
        );
        Object.assign(build, {
          status: "built",
          failure_reason: null,
          finished_at: now(),
          heartbeat_at: now(),
          check_report: args.p_check_report,
          topic_tree_hash: args.p_topic_tree_hash,
        });
        return true;
      },
    },
  });
}

export type BuildDb = ReturnType<typeof createBuildDb>;

/** A chunk to seed: its Markdown, or also its label. */
type SeedChunk =
  string | { markdown: string; label?: "content" | "exercise" | "solution" };

/**
 * A section to seed: its heading's title, its own chunks (by default one
 * `content` chunk "About <title>.", or `exercise` ones in an exercise
 * section), each following that heading, and the sections after it.
 */
type SeedSection = {
  title: string;
  exercise?: boolean;
  chunks?: SeedChunk[];
  children?: SeedSection[];
};

/**
 * Every chunk's vector: alike to every KC vector of `useBuildModels`, so
 * an exercise call is offered every KC.
 */
const CHUNK_VECTOR = JSON.stringify(Array.from({ length: 64 }, () => 1));

/**
 * Seeds a parsed Material at `position` in Course order, named "Material
 * <position>", with its sections' chunks in reading order, one page each.
 */
export function seedMaterial(
  db: BuildDb,
  {
    id = crypto.randomUUID(),
    position = db.tables.materials.length,
    language = "English",
    sections,
  }: {
    id?: string;
    position?: number;
    language?: string;
    sections: SeedSection[];
  },
) {
  const name = `Material ${position}`;
  const owned = { owner: STUDENT, course_id: COURSE, material_id: id };
  db.tables.materials.push({
    id,
    owner: STUDENT,
    course_id: COURSE,
    name,
    position,
    language,
    parse_status: "parsed",
  });
  let chunkPosition = 0;
  const add = (section: SeedSection) => {
    const chunks = section.chunks ?? [`About ${section.title}.`];
    for (const chunk of chunks) {
      const { markdown, label } =
        typeof chunk === "string"
          ? { markdown: chunk, label: undefined }
          : chunk;
      const page = chunkPosition + 1;
      db.tables.chunks.push({
        ...owned,
        id: crypto.randomUUID(),
        heading: section.title,
        position: chunkPosition++,
        page_from: page,
        page_to: page,
        label: label ?? (section.exercise ? "exercise" : "content"),
        markdown,
        embedding: CHUNK_VECTOR,
      });
    }
    for (const child of section.children ?? []) add(child);
  };
  for (const section of sections) add(section);
  return id;
}

/**
 * What deleting a Material leaves: its chunks, extractions and the KC
 * sources of its chunks are gone, as the foreign keys cascade.
 */
export function deleteMaterial(db: BuildDb, materialId: string) {
  const ofMaterial = (row: FakeRow) => row.material_id === materialId;
  const chunks = new Set(db.tables.chunks.filter(ofMaterial).map((c) => c.id));
  db.tables.materials = db.tables.materials.filter(
    (row) => row.id !== materialId,
  );
  db.tables.chunks = db.tables.chunks.filter((row) => !ofMaterial(row));
  db.tables.unit_extractions = db.tables.unit_extractions.filter(
    (row) => !ofMaterial(row),
  );
  db.tables.kc_sources = db.tables.kc_sources.filter(
    (row) => !chunks.has(row.chunk_id),
  );
  db.tables.exercises = db.tables.exercises.filter(
    (row) => !chunks.has(row.question_chunk_id),
  );
  const exercises = new Set(db.tables.exercises.map((row) => row.id));
  db.tables.exercise_chunks = db.tables.exercise_chunks.filter(
    (row) => !chunks.has(row.chunk_id) && exercises.has(row.exercise_id),
  );
}

export function chunkWith(db: BuildDb, markdown: string): string {
  return db.tables.chunks.find((chunk) => chunk.markdown === markdown)!
    .id as string;
}

/** The Markdown of each Exercise's question and solution chunks, in order. */
export function exerciseTexts(db: BuildDb) {
  const markdown = (id: unknown) =>
    db.tables.chunks.find((chunk) => chunk.id === id)?.markdown;
  return db.tables.exercises.map((exercise) => {
    const of = (role: string) =>
      db.tables.exercise_chunks
        .filter((row) => row.exercise_id === exercise.id && row.role === role)
        .toSorted((a, b) => Number(a.position) - Number(b.position))
        .map((row) => markdown(row.chunk_id));
    return { question: of("question"), solution: of("solution") };
  });
}

/**
 * Queues a build, as `queue_knowledge_map_build` does, keeping what the
 * stored Topic tree and Exercise groups were made from.
 */
export function queueBuild(db: BuildDb) {
  const last = db.tables.knowledge_map_builds[0];
  db.tables.knowledge_map_builds = [
    {
      course_id: COURSE,
      owner: STUDENT,
      status: "building",
      failure_reason: null,
      finished_at: null,
      started_at: now(),
      heartbeat_at: now(),
      progress: null,
      topic_tree_hash: last?.topic_tree_hash ?? null,
      exercise_groups: last?.exercise_groups ?? null,
      exercise_grouping_hash: last?.exercise_grouping_hash ?? null,
    },
  ];
}

/** The stored Topic tree in tree order, as "name > parent name: KC names". */
export function topicTree(db: BuildDb): string[] {
  const topics = db.tables.topics.toSorted(
    (a, b) => Number(a.position) - Number(b.position),
  );
  const nameOf = (id: unknown) => topics.find((t) => t.id === id)?.name;
  const kcName = (id: unknown) => db.tables.kcs.find((k) => k.id === id)?.name;
  return topics.map((topic) => {
    const kcs = db.tables.topic_kcs
      .filter((row) => row.topic_id === topic.id)
      .toSorted((a, b) => Number(a.position) - Number(b.position))
      .map((row) => kcName(row.kc_id));
    const parent = topic.parent_id ? ` > ${nameOf(topic.parent_id)}` : "";
    return `${topic.name}${parent}: ${kcs.join(", ")}`;
  });
}

export function liveKcs(db: BuildDb) {
  return db.tables.kcs
    .filter((kc) => !kc.retired_at)
    .toSorted((a, b) => Number(a.position) - Number(b.position))
    .map((kc) => kc.name);
}
