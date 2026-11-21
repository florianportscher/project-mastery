import { describe, expect, test } from "vitest";
import {
  checkedGroups,
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
      },
      { questionChunkIds: ["other"], solutionChunkIds: [] },
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
      { questionChunkIds: ["stem"], solutionChunkIds: [] },
      { questionChunkIds: ["a"], solutionChunkIds: ["sol-a"] },
      { questionChunkIds: ["b"], solutionChunkIds: ["sol-b"] },
      { questionChunkIds: ["other"], solutionChunkIds: [] },
    ]);
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
