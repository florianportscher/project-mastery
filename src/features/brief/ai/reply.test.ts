import { describe, expect, test, vi } from "vitest";
import type { BriefContext } from "@/features/brief/domain/intake";

vi.mock("@/lib/ai/models", () => ({ aiTask: () => ({}) }));

const { briefReplySettings } = await import("./reply");

const context: BriefContext = {
  fields: {
    examDate: null,
    goal: null,
    openBook: null,
    formulaSheet: null,
    calculator: null,
    scopeConfirmed: false,
  },
  notes: null,
  materials: [],
  foundExams: [],
  exams: [],
  reservedExam: { answered: false, examId: null },
  language: { name: "English", source: "materials" },
  topics: [],
  examScopes: [],
  adminTexts: [],
};

describe("briefReplySettings", () => {
  test("asks in batches, then closes with a link to the Course map", () => {
    const { instructions } = briefReplySettings(
      context,
      "/courses/course-1/map",
    );
    const order = ["1. the exam date", "2. the format", "3. the scope"]
      .concat(["4. the reserved exam", "5. one open question"])
      .map((batch) => instructions.indexOf(batch));
    expect(order.every((at, i) => at >= 0 && at > (order[i - 1] ?? -1))).toBe(
      true,
    );
    expect(instructions).toContain("[Course map](/courses/course-1/map)");
  });

  test("names the batches whose answers are all stored", () => {
    const { instructions } = briefReplySettings(
      {
        ...context,
        fields: {
          ...context.fields,
          examDate: "2027-03-04",
          goal: "pass",
          openBook: false,
          formulaSheet: null,
          scopeConfirmed: true,
        },
      },
      "/courses/course-1/map",
    );
    expect(instructions).toContain(
      "Batches fully answered, never to ask again: 1 (date and goal), 3 (scope).",
    );
  });

  test("says the Course language is unknown until a Material is parsed", () => {
    const { instructions } = briefReplySettings(
      { ...context, language: { name: "English", source: "fallback" } },
      "/courses/course-1/map",
    );
    expect(instructions).toContain("not known until a Material is parsed");
    expect(instructions).not.toContain("the Materials' own");
  });
});
