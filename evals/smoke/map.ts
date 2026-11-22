import { readFile } from "node:fs/promises";
import {
  buildKnowledgeMap,
  loadCourseUnits,
  unitKey,
} from "@/features/knowledge-map/server";
import { exportCourse } from "./gold-export";
import { GOLD_SLUG } from "./gold-course";
import {
  createCourse,
  GOLD,
  parseSeeded,
  recordedCalls,
  recordedPages,
  type RecordedPage,
} from "./recorded-pages";
import { result, type SmokeCheck, type SmokeResult } from "./smoke-check";

type Supabase = Parameters<SmokeCheck["run"]>[0]["supabase"];

/** The recorded lecture pages: the end of Chapter 3 and Chapter 4, Vector Spaces. */
const LECTURE_PAGES = [17, 18, 19, 20, 21, 22, 23, 24];
const EXERCISE_PAGE = 3;
const SOLUTION_PAGE = 5;
/** The Exercises kept from the recorded exercise pages. */
const KEPT = [7, 8, 9, 10];
/** The most generating calls of the first Update map; embeddings aside. */
const MAX_BUILD_CALLS = 10;

/** The exercise number a unit or chunk prints first, as in "Exercise 8". */
const printedNumber = (markdown: unknown) => {
  const found = /Exercise (\d+)/.exec(String(markdown))?.[1];
  return found === undefined ? null : Number(found);
};

/**
 * The recorded exercise page up to Exercise 10, with the "8.3 Vector
 * spaces" heading between, and the solution page's solutions to Exercises
 * 7–10.
 */
function keptExercises(exercises: RecordedPage, solutions: RecordedPage) {
  const after = exercises.units.findIndex(
    (unit) => (printedNumber(unit.markdown) ?? 0) > KEPT.at(-1)!,
  );
  return [
    { ...exercises, units: exercises.units.slice(0, after) },
    {
      ...solutions,
      units: solutions.units.filter((unit) =>
        KEPT.includes(printedNumber(unit.markdown) ?? 0),
      ),
    },
  ];
}

/**
 * Update map from the recorded gold pages (#229): the lecture notes' pages
 * 17–24 and Exercises 7–10 with their printed solutions, parsed without
 * page calls, then built twice with the real
 * workflow in this process. On the default smoke model; pinned to a slow
 * model with AI_SMOKE_MODEL it may take 10 minutes (`AI_SMOKE_MAX_MINUTES=10`).
 */
export const mapSmoke: SmokeCheck = {
  name: "map",
  // The parse's chunk embeddings and pairing call, the first build's calls
  // and its KC embeddings.
  maxCalls: MAX_BUILD_CALLS + 8,
  usage: `pnpm smoke map [export] (export writes the built Course as the ${GOLD_SLUG} snapshot; Update map from the recorded pages ${LECTURE_PAGES[0]}–${LECTURE_PAGES.at(-1)} of ${GOLD}/lecture-notes.pdf and Exercises ${KEPT.join(", ")}; AI_SMOKE_MAX_MINUTES=10)`,
  async run({ supabase, studentId, args }) {
    const lecture = await recordedPages("lecture-notes.pdf");
    const exercisePage = await recordedPages("exercises.pdf");
    const courseId = await createCourse(supabase, studentId, "Smoke map");
    for (const [file, name, pages] of [
      [
        "lecture-notes.pdf",
        "Lecture notes",
        LECTURE_PAGES.map((number) => lecture(number)),
      ],
      [
        "exercises.pdf",
        "Exercises",
        keptExercises(exercisePage(EXERCISE_PAGE), exercisePage(SOLUTION_PAGE)),
      ],
    ] as const) {
      const pdf = new Uint8Array(await readFile(`${GOLD}/${file}`));
      await parseSeeded({ supabase, studentId, pdf }, courseId, name, pages);
    }

    const generating = async () =>
      (await recordedCalls(supabase, studentId)) -
      (await recordedCalls(supabase, studentId, "embed"));
    const parsed = await generating();
    console.info("Updating the map…");
    await update(supabase, courseId, studentId);
    const built = await generating();
    const allBuilt = await recordedCalls(supabase, studentId);
    const results = await checkMap(supabase, courseId);
    console.info("Updating the map again…");
    await update(supabase, courseId, studentId);
    const again = await recordedCalls(supabase, studentId);
    // Without the gold run's snapshot, the checks that need a built Course
    // seed this one, uncommitted.
    if (args.includes("export")) {
      await exportCourse(supabase, courseId, GOLD_SLUG, "Linear Algebra I");
    }
    return [
      ...results,
      result(
        `the first Update map makes at most ${MAX_BUILD_CALLS} calls, embeddings aside`,
        built - parsed <= MAX_BUILD_CALLS,
        `${built - parsed} calls`,
      ),
      result(
        "a second Update map makes no call",
        again === allBuilt,
        `${again - allBuilt} calls`,
      ),
    ];
  },
};

/**
 * Queues a build as `queue_knowledge_map_build` would (it needs a signed-in
 * Student) and runs it.
 */
async function update(supabase: Supabase, courseId: string, owner: string) {
  const { error } = await supabase.from("knowledge_map_builds").upsert(
    {
      course_id: courseId,
      owner,
      status: "building",
      failure_reason: null,
      // As the queue sets it: KCs stored since then are this build's.
      started_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
    },
    { onConflict: "course_id" },
  );
  if (error) throw new Error(error.message);
  await buildKnowledgeMap(courseId);
}

/** A stored Topic as the check reads it. */
type StoredTopic = {
  id: string;
  parent_id: string | null;
  name: string;
  central_question: string | null;
};

async function checkMap(
  supabase: Supabase,
  courseId: string,
): Promise<SmokeResult[]> {
  const [build, topics, extractions, chunks, kcs, exercises] =
    await Promise.all([
      supabase
        .from("knowledge_map_builds")
        .select("status, failure_reason, check_report")
        .eq("course_id", courseId)
        .single(),
      supabase
        .from("topics")
        .select("id, parent_id, name, central_question")
        .eq("course_id", courseId)
        .order("position"),
      supabase
        .from("unit_extractions")
        .select("material_id, kind, batch, output, kc_ids")
        .eq("course_id", courseId),
      supabase.from("chunks").select("id, markdown").eq("course_id", courseId),
      supabase
        .from("kcs")
        .select("id, name, description")
        .eq("course_id", courseId)
        .is("retired_at", null),
      supabase
        .from("exercises")
        .select("question_chunk_id, final_answers")
        .eq("course_id", courseId),
    ]);
  for (const { error } of [build, topics, extractions, chunks]) {
    if (error) throw new Error(error.message);
  }
  for (const { error } of [kcs, exercises]) {
    if (error) throw new Error(error.message);
  }
  const links = await supabase
    .from("prerequisite_links")
    .select("from_kc, to_kc")
    .eq("course_id", courseId);
  if (links.error) throw new Error(links.error.message);
  // A KC may cite any chunk of its unit.
  const units = (
    await Promise.all(
      (["content", "exercise"] as const).map((kind) =>
        loadCourseUnits(supabase, courseId, kind),
      ),
    )
  ).flat();
  const unitChunks = new Map(
    units.map((unit) => [
      unitKey(unit),
      new Set(unit.chunks.map((chunk) => chunk.id)),
    ]),
  );
  const strays = extractions.data!.flatMap((row) => {
    const allowed =
      unitChunks.get(
        unitKey({
          materialId: row.material_id,
          kind: row.kind,
          batch: row.batch,
        }),
      ) ?? new Set<string>();
    return (
      row.output as { kcs: Array<{ name: string; chunkIds: string[] }> }
    ).kcs
      .filter(
        (kc) =>
          kc.chunkIds.length === 0 ||
          kc.chunkIds.some((id) => !allowed.has(id)),
      )
      .map((kc) => kc.name);
  });
  // The Topic tree: every live KC sits in one.
  const topicKcs = await supabase
    .from("topic_kcs")
    .select("topic_id, kc_id")
    .in(
      "topic_id",
      topics.data!.map((topic) => topic.id),
    );
  if (topicKcs.error) throw new Error(topicKcs.error.message);
  const placed = new Set(topicKcs.data.map((row) => row.kc_id));
  const unplaced = kcs.data!.filter((kc) => !placed.has(kc.id));

  const depthOf = (topic: StoredTopic): number =>
    topic.parent_id === null
      ? 0
      : 1 + depthOf(topics.data!.find((t) => t.id === topic.parent_id)!);
  for (const topic of topics.data!) {
    console.info(
      `  ${"  ".repeat(depthOf(topic))}Topic: ${topic.name}${topic.central_question ? ` — ${topic.central_question}` : ""}`,
    );
  }
  console.info(`  KCs: ${kcs.data!.map((kc) => kc.name).join("; ")}`);
  console.info(`  Check report: ${JSON.stringify(build.data!.check_report)}`);
  return [
    result(
      "the map is built",
      build.data!.status === "built",
      build.data!.failure_reason ?? undefined,
    ),
    result("the map has KCs", kcs.data!.length > 0, `${kcs.data!.length} KCs`),
    result(
      "every KC cites a chunk of its unit",
      strays.length === 0,
      strays.join("; ") || undefined,
    ),
    result(
      "every KC sits in a Topic",
      unplaced.length === 0,
      unplaced.map((kc) => kc.name).join("; ") || undefined,
    ),
  ];
}
