// @vitest-environment node
// The Brief handler: what each tool result tells the model on the next step.
// Shared setup and helpers: handler-testing.ts.
import { describe, expect, test, vi } from "vitest";
import { mockToolModel, useMockModels } from "@/lib/ai/testing";
import {
  COURSE,
  EXAM_2024,
  KLAUSUR_2023,
  OLD_EXAM,
  STUDENT,
  db,
  send,
  userMessage,
} from "./handler-testing";

vi.mock("server-only", () => ({}));

const foundExam = (id: string) =>
  db.tables.exams.find((exam) => exam.id === id)!;

function seedBrief(notes: string | null = null) {
  db.tables.briefs.push({
    course_id: COURSE,
    owner: STUDENT,
    exam_date: "2026-12-03",
    goal: "pass",
    open_book: false,
    formula_sheet: false,
    calculator: true,
    scope_confirmed: true,
    notes,
  });
}

/** A model that makes one tool call, then replies "Ok.". */
const toolModel = (toolName: string, input: Record<string, unknown>) =>
  mockToolModel([[{ toolName, input }]], "Ok.");

/** Sends a message to `model` and returns the prompt of its last step. */
async function lastPrompt(model: ReturnType<typeof toolModel>) {
  await send({ courseId: COURSE, message: userMessage("…") });
  return JSON.stringify(model.doStreamCalls.at(-1)!.prompt);
}

describe("a tool result", () => {
  test("saveBrief names the ids it ignored", async () => {
    const model = toolModel("saveBrief", {
      excludedMaterialIds: [OLD_EXAM, "not-a-material"],
    });
    useMockModels({ brief: model });

    const prompt = await lastPrompt(model);

    expect(prompt).toContain(
      "These are no Material ids of the Course and were ignored: not-a-material.",
    );
  });

  test("saveBrief stores the reserved exams, or none, and names an id that is no old exam", async () => {
    seedBrief();
    foundExam(KLAUSUR_2023).confirmed = true;
    foundExam(EXAM_2024).confirmed = true;

    useMockModels({
      brief: toolModel("saveBrief", {
        reservedExamIds: [KLAUSUR_2023, EXAM_2024],
      }),
    });
    await send({ courseId: COURSE, message: userMessage("…") });
    expect(db.tables.briefs[0]?.reserved_exam_answered).toBe(true);
    expect(foundExam(KLAUSUR_2023).reserved).toBe(true);
    expect(foundExam(EXAM_2024).reserved).toBe(true);

    const unknown = toolModel("saveBrief", {
      reservedExamIds: [KLAUSUR_2023, "not-an-exam"],
    });
    useMockModels({ brief: unknown });
    expect(await lastPrompt(unknown)).toContain(
      "These are no ids of old exams and were left out of the reserved exams: not-an-exam.",
    );
    expect(foundExam(KLAUSUR_2023).reserved).toBe(true);
    expect(foundExam(EXAM_2024).reserved).toBe(false);

    useMockModels({ brief: toolModel("saveBrief", { reservedExamIds: [] }) });
    await send({ courseId: COURSE, message: userMessage("…") });
    expect(foundExam(KLAUSUR_2023).reserved).toBe(false);
    expect(db.tables.briefs[0]?.reserved_exam_answered).toBe(true);
  });

  test("saveBrief stores the Course language the Student asked for", async () => {
    seedBrief();
    useMockModels({
      brief: toolModel("saveBrief", { courseLanguage: "German" }),
    });

    await send({ courseId: COURSE, message: userMessage("Auf Deutsch!") });

    expect(db.tables.courses[0]?.language).toBe("German");
  });

  test("a reply's last step stays on auto for Muse, which refuses toolChoice none", async () => {
    seedBrief();
    const call = { toolName: "saveBrief", input: { goal: "pass" } };
    const model = mockToolModel([[call], [call], [call], [call]], "Ok.");
    useMockModels({ brief: model });

    await send({ courseId: COURSE, message: userMessage("…") });

    expect(model.doStreamCalls.map(({ toolChoice }) => toolChoice)).toEqual([
      ...Array(5).fill({ type: "auto" }),
    ]);
  });

  test("addNote over the notes' limit changes nothing and says so", async () => {
    const full = "x".repeat(19_990);
    seedBrief(full);

    const model = toolModel("addNote", { text: "Heat exchangers!" });
    useMockModels({ brief: model });

    const prompt = await lastPrompt(model);

    expect(prompt).toContain("Not saved: the notes are full. Nothing changed.");
    expect(db.tables.briefs[0]?.notes).toBe(full);
  });
});
