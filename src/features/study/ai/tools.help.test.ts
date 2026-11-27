// @vitest-environment node
// The help `grade` stores from the Student's Hint and Show the solution
// presses (#449).
import { expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  tutorTools,
  type QuestionToGrade,
  type TutorToolActions,
} from "@/features/study/ai/tools";

type Pressed = { hints: number; solutionShown: boolean };
const none: Pressed = { hints: 0, solutionShown: false };

const saved: Array<Parameters<TutorToolActions["saveGrade"]>[0]> = [];

/** Grades both parts full, help "none", on a question with these presses. */
async function gradeWith(
  first: Pressed,
  second: Pressed,
  sameKc = false,
  verdicts = ["full", "full"],
) {
  saved.length = 0;
  const question: QuestionToGrade = {
    id: "q-1",
    kcIds: ["kc-a", "kc-b"],
    retiredKcIds: [],
    parts: [
      { position: 1, kcId: "kc-a", ...first },
      { position: 2, kcId: sameKc ? "kc-a" : "kc-b", ...second },
    ],
    answered: true,
    graded: false,
    sessionEnded: false,
    finalAnswers: null,
  };
  const tools = tutorTools({
    getTopic: async () => null,
    findProblems: async () => ({ problems: [] }),
    remember: async () => {},
    ask: async () => ({ questionId: "q-1", problem: null }),
    findQuestion: async () => question,
    saveGrade: async (input) => {
      saved.push(input);
      return [];
    },
    closeQuestion: async () => true,
    findReading: async () => null,
    searchMaterials: async () => [],
    compute: async () => ({ ok: false, error: "unused" }),
  });
  await tools.grade.execute!(
    {
      results: verdicts.map((result, index) => ({
        position: index + 1,
        result,
        note: `Note ${index + 1}`,
      })),
      help: "none",
    } as never,
    { toolCallId: "1", messages: [] } as never,
  );
}

test("a hint is at least some help, on its KC alone", async () => {
  await gradeWith({ hints: 1, solutionShown: false }, none);
  expect(saved[0]?.results).toEqual([
    { kcId: "kc-a", result: "full", help: "some" },
    { kcId: "kc-b", result: "full", help: "none" },
  ]);
});

test("a shown solution is stored wrong, whatever grade sends, with solution_shown", async () => {
  await gradeWith(none, { hints: 2, solutionShown: true });
  expect(saved[0]?.parts).toEqual([
    { position: 1, result: "full", note: "Note 1" },
    { position: 2, result: "wrong", note: "Note 2" },
  ]);
  expect(saved[0]?.results).toEqual([
    { kcId: "kc-a", result: "full", help: "none" },
    { kcId: "kc-b", result: "wrong", help: "solution_shown" },
  ]);
});

test("a KC takes the most help of its parts", async () => {
  await gradeWith(
    { hints: 1, solutionShown: false },
    { hints: 0, solutionShown: true },
    true,
    ["full", "unanswered"],
  );
  expect(saved[0]?.results).toEqual([
    { kcId: "kc-a", result: "wrong", help: "solution_shown" },
  ]);
});
