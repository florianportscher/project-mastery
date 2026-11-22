import { groupExercises } from "@/features/knowledge-map/server";
import { createCourse, recordedCalls, recordedPages } from "./recorded-pages";
import { result, type SmokeCheck, type SmokeResult } from "./smoke-check";

/**
 * The grouping call of a build (#350) on a small real Course: an exercise
 * sheet (the recorded page 3 of the gold `exercises.pdf`, Exercises 7–16)
 * whose solutions are in another Material (its recorded page 5), and an old
 * exam (Problem 2 of the gold `past-exams.pdf`) with a shared stem and its
 * solutions printed between its subtasks. Chunks are stored directly, so
 * the grouping step makes the only call.
 */

const FILE = "exercises.pdf";

/**
 * The exercises whose solutions the recorded solution page prints. The
 * page also prints solutions to Exercises 3, 6, 18 and 21, whose
 * exercises are on pages not recorded.
 */
const SOLVED = ["8", "9", "10", "14", "15"];

/** Problem 2 of the gold exam, cut as a page read cuts it. */
const EXAM: Array<{ label: "exercise" | "solution"; markdown: string }> = [
  {
    label: "exercise",
    markdown:
      "**Problem 2** [10 points]\n\nFor $t \\in \\mathbb{R}$ consider the real system of linear equations\n\n$$x + y + tz = 1,\\quad x + ty + z = 1,\\quad tx + y + z = 1.$$",
  },
  {
    label: "exercise",
    markdown:
      "(a) Determine all $t \\in \\mathbb{R}$ for which the system has (i) no solution, (ii) exactly one solution, (iii) infinitely many solutions. (7)",
  },
  {
    label: "solution",
    markdown:
      "*Solution (a).* Gaussian elimination gives the rows $(1\\; 1\\; t \\mid 1)$, $(0\\; t-1\\; 1-t \\mid 0)$, $(0\\; 0\\; (1-t)(2+t) \\mid 1-t)$. For $t = -2$ the last row reads $(0\\;0\\;0 \\mid 3)$: no solution. For $t = 1$ infinitely many solutions. Otherwise the rank is 3: exactly one solution.",
  },
  {
    label: "exercise",
    markdown: "(b) Give the solution set in cases (ii) and (iii). (3)",
  },
  {
    label: "solution",
    markdown:
      "*Solution (b).* For $t = 1$: $L = \\{(1,0,0)^\\top + s(-1,1,0)^\\top + u(-1,0,1)^\\top \\mid s, u \\in \\mathbb{R}\\}$. For $t \\notin \\{1, -2\\}$: $x = y = z = \\frac{1}{t+2}$.",
  },
];

type Smoke = Parameters<SmokeCheck["run"]>[0];
type Supabase = Smoke["supabase"];
type SeedChunk = { label: string; markdown: string; page: number };

export const pairSmoke: SmokeCheck = {
  name: "pair",
  // The Course's one grouping call.
  maxCalls: 1,
  model: "meta/muse-ember",
  usage: `pnpm smoke pair (the recorded pages 3 and 5 of ${FILE} and Problem 2 of past-exams.pdf)`,
  async run({ supabase, studentId }) {
    const page = await recordedPages(FILE);
    const chunksOf = (number: number): SeedChunk[] =>
      page(number).units.flatMap((unit) =>
        unit.label === "exercise" || unit.label === "solution"
          ? [
              {
                label: unit.label,
                markdown: String(unit.markdown),
                page: number,
              },
            ]
          : [],
      );
    const courseId = await createCourse(supabase, studentId, "Smoke group");
    const scope = { supabase, studentId, courseId };
    await seedMaterial(scope, 0, "Exercise sheet 3", chunksOf(3));
    await seedMaterial(scope, 1, "Solutions to sheet 3", chunksOf(5));
    await seedMaterial(
      scope,
      2,
      "Final Exam 2025-26",
      EXAM.map((chunk) => ({ ...chunk, page: 2 })),
    );
    const building = await supabase.from("knowledge_map_builds").insert({
      course_id: courseId,
      owner: studentId,
      status: "building",
    });
    if (building.error) throw new Error(building.error.message);

    const before = await recordedCalls(supabase, studentId, "ingest");
    const outcome = await groupExercises(courseId);
    const calls = (await recordedCalls(supabase, studentId, "ingest")) - before;
    return [
      result(
        "the grouping step ends",
        outcome.ok && outcome.left === 0,
        JSON.stringify(outcome),
      ),
      ...(await checkGroups(supabase, courseId)),
      result("one grouping call", calls === 1, `${calls} calls`),
    ];
  },
};

/** A parsed Material of these chunks. */
async function seedMaterial(
  {
    supabase,
    studentId,
    courseId,
  }: { supabase: Supabase; studentId: string; courseId: string },
  position: number,
  name: string,
  chunks: SeedChunk[],
) {
  const materialId = crypto.randomUUID();
  const owned = { owner: studentId, course_id: courseId };
  const material = await supabase.from("materials").insert({
    ...owned,
    id: materialId,
    name,
    position,
    media_type: "application/pdf",
    size_bytes: 1,
    storage_path: `${studentId}/${courseId}/${materialId}`,
    parse_status: "parsed",
  });
  if (material.error) throw new Error(material.error.message);
  const stored = await supabase.from("chunks").insert(
    chunks.map((chunk, index) => ({
      ...owned,
      material_id: materialId,
      position: index,
      page_from: chunk.page,
      page_to: chunk.page,
      label: chunk.label,
      markdown: chunk.markdown,
    })),
  );
  if (stored.error) throw new Error(stored.error.message);
}

/** The exercise number a chunk prints, as "Exercise 8" or "Solution to Exercise 8". */
const printedNumber = (markdown: string) =>
  /Exercise (\d+)/.exec(markdown)?.[1] ?? null;

async function checkGroups(
  supabase: Supabase,
  courseId: string,
): Promise<SmokeResult[]> {
  const [chunks, build] = await Promise.all([
    supabase
      .from("chunks")
      .select("id, label, markdown")
      .eq("course_id", courseId)
      .in("label", ["exercise", "solution"]),
    supabase
      .from("knowledge_map_builds")
      .select("exercise_groups")
      .eq("course_id", courseId)
      .single(),
  ]);
  if (chunks.error) throw new Error(chunks.error.message);
  if (build.error) throw new Error(build.error.message);
  const groups =
    (
      build.data.exercise_groups as {
        exercises: Array<{
          questionChunkIds: string[];
          solutionChunkIds: string[];
        }>;
      } | null
    )?.exercises ?? [];
  const markdownOf = new Map(chunks.data.map((c) => [c.id, c.markdown]));
  const exerciseOf = (chunkId: string) =>
    groups.findIndex(
      (group) =>
        group.questionChunkIds.includes(chunkId) ||
        group.solutionChunkIds.includes(chunkId),
    );
  const idOf = (markdown: string) =>
    chunks.data.find((c) => c.markdown === markdown)!.id;
  console.info(
    groups
      .map(
        (group) =>
          `  [${group.questionChunkIds.map((id) => markdownOf.get(id)!.slice(0, 18)).join(" | ")}] → [${group.solutionChunkIds.map((id) => markdownOf.get(id)!.slice(0, 22)).join(" | ")}]`,
      )
      .join("\n"),
  );

  // The sheet: each recorded solution with its exercise, the others in none.
  const wrong = chunks.data
    .filter(
      (c) =>
        c.label === "solution" && !EXAM.some((e) => e.markdown === c.markdown),
    )
    .flatMap((solution) => {
      const number = printedNumber(solution.markdown);
      const group = exerciseOf(solution.id);
      const got =
        group < 0
          ? null
          : printedNumber(markdownOf.get(groups[group]!.questionChunkIds[0]!)!);
      const want = number && SOLVED.includes(number) ? number : null;
      return got === want
        ? []
        : [`Solution to ${number} landed with ${got ?? "no Exercise"}`];
    });
  // The exam: its stem, subtasks and solutions in one Exercise.
  const exam = EXAM.map((chunk) => exerciseOf(idOf(chunk.markdown)));
  return [
    result(
      `Solutions to Exercises ${SOLVED.join(", ")} land in their Exercises, the others in none`,
      wrong.length === 0,
      wrong.join("; ") || undefined,
    ),
    result(
      "the exam's stem, both subtasks and both solutions form one Exercise",
      exam[0]! >= 0 && exam.every((group) => group === exam[0]),
      `Exercises by chunk: ${exam.join(", ")}`,
    ),
  ];
}
