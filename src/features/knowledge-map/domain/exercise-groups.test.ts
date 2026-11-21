import { describe, expect, test } from "vitest";
import {
  checkedExams,
  checkedGroups,
  courseExams,
  exerciseBatches,
  groupingRuns,
  offeredIds,
  type GroupingChunk,
} from "./exercise-groups";

const chunks: GroupingChunk[] = [
  { id: "stem", label: "exercise" },
  { id: "a", label: "exercise" },
  { id: "sol-a", label: "solution" },
  { id: "b", label: "exercise" },
  { id: "sol-b", label: "solution" },
  { id: "other", label: "exercise" },
];
const offered = offeredIds(chunks);

describe("checkedGroups", () => {
  test("keeps a stem with its subtasks and every solution, in Course order", () => {
    expect(
      checkedGroups(
        [{ questionIds: ["e3", "e1", "e2"], solutionIds: ["s2", "s1"] }],
        offered,
      ),
    ).toEqual([
      {
        questionChunkIds: ["stem", "a", "b"],
        solutionChunkIds: ["sol-a", "sol-b"],
        exam: null,
      },
      { questionChunkIds: ["other"], solutionChunkIds: [], exam: null },
    ]);
  });

  test("gives a chunk to the first Exercise naming it and drops unknown ids", () => {
    expect(
      checkedGroups(
        [
          { questionIds: ["e2", "x9"], solutionIds: ["s1", "e3"] },
          { questionIds: ["e2", "s2"], solutionIds: ["s1"] },
          { questionIds: ["e3"], solutionIds: ["s1", "s2"] },
        ],
        offered,
      ),
    ).toEqual([
      { questionChunkIds: ["stem"], solutionChunkIds: [], exam: null },
      { questionChunkIds: ["a"], solutionChunkIds: ["sol-a"], exam: null },
      { questionChunkIds: ["b"], solutionChunkIds: ["sol-b"], exam: null },
      { questionChunkIds: ["other"], solutionChunkIds: [], exam: null },
    ]);
  });

  test("keeps an exam name the answer lists and drops one it does not", () => {
    const groups = checkedGroups(
      [
        { questionIds: ["e1"], solutionIds: [], exam: " Klausur 2023 " },
        { questionIds: ["e2"], solutionIds: [], exam: "Klausur 1999" },
      ],
      offered,
      new Set(["Klausur 2023"]),
    );
    expect(groups.map((g) => g.exam)).toEqual([
      "Klausur 2023",
      null,
      null,
      null,
    ]);
  });
});

describe("exams", () => {
  test("a run's exams continue an offered stored exam once, and a repeated name is one exam", () => {
    expect(
      checkedExams(
        [
          { name: "Klausur 2023", continues: "x1" },
          { name: "Klausur 2024", continues: "x1" },
          { name: "Klausur 2023", continues: null },
          { name: "Resit", continues: "x9" },
        ],
        new Map([["x1", "stored-2023"]]),
      ),
    ).toEqual([
      { name: "Klausur 2023", storedId: "stored-2023" },
      { name: "Klausur 2024", storedId: null },
      { name: "Resit", storedId: null },
    ]);
  });

  test("runs share an exam by name or stored id; one without Exercises goes", () => {
    const group = (id: string, exam: string | null) => ({
      questionChunkIds: [id],
      solutionChunkIds: [],
      exam,
    });
    const { exams, groups } = courseExams([
      {
        groups: [group("a", null), group("b", "Klausur 2023")],
        exams: [
          { name: "Klausur 2023", storedId: null },
          { name: "Unused", storedId: null },
        ],
      },
      {
        groups: [group("c", "Exam 2023"), group("d", "Klausur 2023")],
        exams: [
          { name: "Klausur 2023", storedId: null },
          { name: "Exam 2023", storedId: "s1" },
        ],
      },
    ]);
    expect(exams).toEqual([
      { name: "Klausur 2023", storedId: null },
      { name: "Exam 2023", storedId: "s1" },
    ]);
    expect(groups.map((g) => g.exam)).toEqual([null, 0, 1, 0]);
  });
});

test("a run without exercise chunks needs no call", () => {
  const solutions: GroupingChunk[] = [
    { id: "s", label: "solution" },
    { id: "t", label: "solution" },
  ];
  expect(groupingRuns([...solutions, ...chunks], 2)).toHaveLength(3);
});

test("batches pack Exercises up to the cap and never span two Materials", () => {
  const exercise = (material: string, chars: number) => ({ material, chars });
  const batches = exerciseBatches(
    [
      exercise("A", 6),
      exercise("A", 4),
      exercise("A", 1),
      exercise("A", 20),
      exercise("B", 1),
    ],
    10,
  );
  expect(batches.map((batch) => batch.map((e) => e.chars))).toEqual([
    [6, 4],
    [1],
    [20],
    [1],
  ]);
});
