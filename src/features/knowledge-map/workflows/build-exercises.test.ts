// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { markAdminClient, type Supabase } from "@/lib/supabase/types";
import {
  COURSE,
  chunkWith,
  createBuildDb,
  deleteMaterial,
  exerciseTexts,
  queueBuild,
  seedMaterial,
  useBuildModels,
} from "./build-testing";

/**
 * Update map's Exercises in-process, with mock `ingest`, `map`, `exercise`
 * and `embed` models: one grouping call over the Course's exercise and
 * solution chunks, then one call per exercise batch, stored by first
 * question chunk and extracted again in place when its chunks change.
 */

vi.mock("server-only", () => ({}));

let db = createBuildDb();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => markAdminClient(db as unknown as Supabase),
}));

const { buildKnowledgeMap } = await import("./build-knowledge-map");

async function update() {
  queueBuild(db);
  await buildKnowledgeMap(COURSE);
}

const STEM = "Let U be the plane x + y + z = 0.";
const PART_A = "(a) Find the dimension of U.";
const PART_B = "(b) Give a basis of U.";
const SOLUTION_A = "dim U = 2.";
const SOLUTION_B = "A basis is (1, -1, 0), (1, 0, -1).";
const DIM_U = { label: "dim U", value: "2", anyOrder: false };

const kcNamesOf = (exerciseId: unknown) =>
  db.tables.exercise_kcs
    .filter((link) => link.exercise_id === exerciseId)
    .map((link) => db.tables.kcs.find((kc) => kc.id === link.kc_id)!.name);

const kcsOf = () => ["Dimension"];

const EXAM_MATERIAL = "exam-material";

/** An exam whose subtasks share a stem, each followed by its solution. */
function seedExam() {
  return seedMaterial(db, {
    id: EXAM_MATERIAL,
    sections: [
      {
        title: "Exam 2025",
        exercise: true,
        chunks: [
          STEM,
          PART_A,
          { markdown: SOLUTION_A, label: "solution" },
          PART_B,
          { markdown: SOLUTION_B, label: "solution" },
        ],
      },
    ],
  });
}

const wholeTask = () => [
  { question: [STEM, PART_A, PART_B], solution: [SOLUTION_A, SOLUTION_B] },
];

beforeEach(() => {
  db = createBuildDb();
  seedMaterial(db, { sections: [{ title: "Dimension" }] });
});

describe("Update map's Exercises", () => {
  test("stores a whole task with its stem, every subtask and every solution", async () => {
    seedExam();
    const { exercises, groupings } = useBuildModels({
      kcsOf,
      groupsOf: wholeTask,
      subtaskOf: () => ({
        kcs: ["Dimension", "Unknown"],
        newKcs: ["Basis of a subspace"],
        finalAnswers: [DIM_U],
      }),
    });

    await update();

    expect(groupings).toHaveLength(1);
    expect(exercises).toHaveLength(1);
    expect(exercises[0]!.exercises).toEqual([
      {
        id: "x1",
        statement: [STEM, PART_A, PART_B].join("\n\n"),
        solution: [SOLUTION_A, SOLUTION_B].join("\n\n"),
      },
    ]);
    expect(exerciseTexts(db)).toEqual([
      { question: [STEM, PART_A, PART_B], solution: [SOLUTION_A, SOLUTION_B] },
    ]);
    expect(db.tables.exercises).toEqual([
      expect.objectContaining({
        question_chunk_id: chunkWith(db, STEM),
        final_answers: [DIM_U],
        difficulty: 2,
      }),
    ]);
    expect(kcNamesOf(db.tables.exercises[0]!.id)).toEqual([
      "Dimension",
      "Basis of a subspace",
    ]);
    const added = db.tables.kcs.find((kc) => kc.name === "Basis of a subspace");
    expect(added).toMatchObject({ origin: "exercise" });

    // Nothing changed: no grouping and no exercise call.
    const again = useBuildModels();
    await update();
    expect(again.groupings).toEqual([]);
    expect(again.exercises).toEqual([]);
  });

  test("calls again for answers from another prompt, and replaces their KCs in place", async () => {
    seedMaterial(db, { sections: [{ title: "Rank" }] });
    seedExam();
    const answers = {
      groupsOf: wholeTask,
      subtaskOf: () => ({ kcs: ["Dimension"], newKcs: ["Basis"] }),
    };
    useBuildModels(answers);
    await update();
    const live = () =>
      db.tables.kcs
        .filter((kc) => !kc.retired_at)
        .map((kc) => `${kc.id} ${kc.name}`)
        .toSorted();
    const sources = () =>
      db.tables.kc_sources.map((s) => `${s.kc_id} ${s.chunk_id}`).toSorted();
    const before = { kcs: live(), sources: sources() };
    expect(before.kcs).toHaveLength(3);

    // An older preview's prompts answered what is stored.
    for (const row of db.tables.unit_extractions) row.prompt_digest = "older";
    Object.assign(db.tables.knowledge_map_builds[0]!, {
      exercise_grouping_hash: "older",
      topic_tree_hash: "older",
    });
    const again = useBuildModels(answers);
    await update();

    expect(again.groupings).toHaveLength(1);
    expect(again.trees).toHaveLength(1);
    expect(again.exercises).toHaveLength(1);
    // A batch is not offered the KCs it gave itself.
    expect(again.exercises[0]!.kcs.map((kc) => kc.name)).toEqual([
      "Dimension",
      "Rank",
    ]);
    expect(
      again.extractions.map((unit) => [
        unit.chunks[0]!.heading,
        unit.knownKcs.map((kc) => kc.name),
      ]),
    ).toEqual([
      ["Dimension", ["Basis"]],
      ["Rank", ["Dimension", "Basis"]],
    ]);
    expect({ kcs: live(), sources: sources() }).toEqual(before);

    const third = useBuildModels(answers);
    await update();
    expect([
      third.extractions,
      third.exercises,
      third.groupings,
      third.trees,
    ]).toEqual([[], [], [], []]);
  });

  test("keeps every chunk when the grouping leaves some out, and drops what is no exercise", async () => {
    seedExam();
    const { exercises } = useBuildModels({
      kcsOf,
      groupsOf: () => [{ question: [PART_A], solution: [SOLUTION_A, "s9"] }],
      subtaskOf: (exercise) =>
        exercise.statement === STEM ? { notAnExercise: true } : {},
    });
    await update();

    expect(exercises[0]!.exercises.map((e) => e.statement)).toEqual([
      STEM,
      PART_A,
      PART_B,
    ]);
    expect(exerciseTexts(db)).toEqual([
      { question: [PART_A], solution: [SOLUTION_A] },
      { question: [PART_B], solution: [] },
    ]);
  });

  test("makes each exercise chunk an Exercise of its own when the grouping keeps failing", async () => {
    seedExam();
    const { groupings } = useBuildModels({ kcsOf, groupingFails: 2 });
    await update();

    expect(groupings).toHaveLength(2);
    expect(exerciseTexts(db)).toEqual([
      { question: [STEM], solution: [] },
      { question: [PART_A], solution: [] },
      { question: [PART_B], solution: [] },
    ]);
    expect(db.tables.knowledge_map_builds[0]).toMatchObject({
      status: "built",
      check_report: expect.objectContaining({ exercisesNotGrouped: true }),
    });
  });

  test("offers a batch every live KC of the Course, not only the nearest", async () => {
    const names = Array.from({ length: 60 }, (_, i) => `K${i + 1}`);
    seedMaterial(db, {
      sections: [{ title: "Sheet 3", exercise: true, chunks: ["Subject."] }],
    });
    const { exercises } = useBuildModels({ kcsOf: () => names });
    await update();

    expect(exercises).toHaveLength(1);
    expect(exercises[0]!.kcs.map((kc) => kc.name)).toEqual(names);
  });

  test("extracts an Exercise again in place when its solution comes later or goes", async () => {
    seedMaterial(db, {
      sections: [{ title: "Sheet 2", exercise: true, chunks: [PART_A] }],
    });
    useBuildModels({ kcsOf, subtaskOf: () => ({ kcs: ["Dimension"] }) });
    await update();
    const [exercise] = db.tables.exercises;
    expect(exercise).toMatchObject({ difficulty: 1 });
    db.tables.attempts.push({ exercise_id: exercise!.id, result: "full" });

    const solutions = seedMaterial(db, {
      sections: [
        {
          title: "Solutions",
          chunks: [{ markdown: SOLUTION_A, label: "solution" }],
        },
      ],
    });
    const later = useBuildModels({
      kcsOf,
      groupsOf: () => [{ question: [PART_A], solution: [SOLUTION_A] }],
      subtaskOf: (sent) => ({
        kcs: ["Dimension"],
        finalAnswers: sent.solution ? [DIM_U] : [],
      }),
    });
    await update();

    expect(later.exercises).toHaveLength(1);
    expect(db.tables.exercises).toEqual([
      expect.objectContaining({ id: exercise!.id, final_answers: [DIM_U] }),
    ]);
    expect(exerciseTexts(db)).toEqual([
      { question: [PART_A], solution: [SOLUTION_A] },
    ]);
    expect(db.tables.attempts).toHaveLength(1);

    deleteMaterial(db, solutions);
    const gone = useBuildModels({
      kcsOf,
      subtaskOf: () => ({ kcs: ["Dimension"] }),
    });
    await update();

    expect(gone.exercises[0]!.exercises[0]!.solution).toBeNull();
    expect(db.tables.exercises).toEqual([
      expect.objectContaining({ id: exercise!.id, final_answers: null }),
    ]);
  });

  test("stores the exams the grouping finds, keeps the Student's answer, and drops one no longer found", async () => {
    seedExam();
    useBuildModels({
      kcsOf,
      groupsOf: () => [{ ...wholeTask()[0]!, exam: "Exam 2025" }],
      subtaskOf: () => ({ kcs: ["Dimension"] }),
    });
    await update();

    expect(db.tables.exams).toEqual([
      expect.objectContaining({
        course_id: COURSE,
        name: "Exam 2025",
        position: 0,
        confirmed: null,
      }),
    ]);
    const exam = db.tables.exams[0]!;
    expect(db.tables.exercises.map((e) => e.exam_id)).toEqual([exam.id]);

    // The Student confirms it; a new sheet changes the chunks, and the
    // grouping finds the exam again under its printed name.
    exam.confirmed = true;
    seedMaterial(db, {
      sections: [{ title: "Sheet 1", exercise: true, chunks: ["Task 1."] }],
    });
    const { groupings } = useBuildModels({
      kcsOf,
      groupsOf: () => [
        { ...wholeTask()[0]!, exam: "Exam 2025" },
        { question: ["Task 1."] },
      ],
      subtaskOf: () => ({ kcs: ["Dimension"] }),
    });
    await update();

    expect(groupings[0]!.exams).toEqual([{ id: "x1", name: "Exam 2025" }]);
    expect(db.tables.exams).toEqual([
      expect.objectContaining({ id: exam.id, confirmed: true }),
    ]);
    const examOf = (text: string) =>
      db.tables.exercises.find(
        (e) => e.question_chunk_id === chunkWith(db, text),
      )?.exam_id;
    expect([examOf(STEM), examOf("Task 1.")]).toEqual([exam.id, null]);

    // The exam is gone from the Materials: its row and the Exercise's link go.
    deleteMaterial(db, EXAM_MATERIAL);
    useBuildModels({
      kcsOf,
      groupsOf: () => [{ question: ["Task 1."] }],
      subtaskOf: () => ({ kcs: ["Dimension"] }),
    });
    await update();

    expect(db.tables.exams).toEqual([]);
  });
});
