import { expect, test } from "vitest";
import { topicFacts } from "@/features/study/domain/topic-facts";

const topics = [
  { id: "t1", name: "Vectors", kcs: ["a", "b"] },
  ...[2, 3, 4, 5, 6, 7].map((n) => ({
    id: `t${n}`,
    name: `Topic ${n}`,
    kcs: [`k${n}`],
  })),
];

test("a Topic's facts: later Topics (at most 5), old-exam Exercises and what each KC builds on inside it", () => {
  const facts = topicFacts({
    topics,
    kcNames: new Map([
      ["a", "Add"],
      ["b", "Scale"],
    ]),
    arrows: [2, 3, 4, 5, 6, 7].map((n) => ({ source: "t1", target: `t${n}` })),
    prerequisites: [
      { from: "a", to: "b" },
      { from: "a", to: "k2" },
    ],
    exercises: [
      { kcs: ["a", "b"], oldExam: true },
      { kcs: ["a"] },
      { kcs: ["k3"], oldExam: true },
    ],
  });
  expect(facts.get("t1")).toEqual({
    buildingTopics: ["Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"],
    oldExamExercises: 1,
    kcBuildsOn: { b: ["Add"] },
  });
  expect(facts.get("t3")?.oldExamExercises).toBe(1);
  expect(facts.get("t2")?.buildingTopics).toEqual([]);
});
