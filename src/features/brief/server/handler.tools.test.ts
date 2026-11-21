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

  test("saveBrief stores the reserved exam, or none, and ignores an exam the Student did not confirm", async () => {
    seedBrief();
    foundExam(KLAUSUR_2023).confirmed = true;

    useMockModels({
      brief: toolModel("saveBrief", { reservedExamId: KLAUSUR_2023 }),
    });
    await send({ courseId: COURSE, message: userMessage("…") });
    expect(db.tables.briefs[0]).toMatchObject({
      reserved_exam_id: KLAUSUR_2023,
      reserved_exam_answered: true,
    });

    const unconfirmed = toolModel("saveBrief", { reservedExamId: EXAM_2024 });
    useMockModels({ brief: unconfirmed });
    expect(await lastPrompt(unconfirmed)).toContain(
      `The reserved exam ${EXAM_2024} was ignored: it is not among the old exams.`,
    );
    expect(db.tables.briefs[0]?.reserved_exam_id).toBe(KLAUSUR_2023);

    useMockModels({
      brief: toolModel("saveBrief", { reservedExamId: "none" }),
    });
    await send({ courseId: COURSE, message: userMessage("…") });
    expect(db.tables.briefs[0]).toMatchObject({
      reserved_exam_id: null,
      reserved_exam_answered: true,
    });
  });

  test("saveBrief keeps a reserved exam that a submitted mock used", async () => {
    seedBrief();
    foundExam(EXAM_2024).confirmed = true;
    Object.assign(db.tables.briefs[0]!, {
      reserved_exam_id: EXAM_2024,
      reserved_exam_answered: true,
    });
    db.tables.mock_exams.push({
      id: "dddddddd-0000-4000-8000-000000000001",
      owner: STUDENT,
      course_id: COURSE,
      reserved_exam_id: EXAM_2024,
      status: "submitted",
    });

    const model = toolModel("saveBrief", { reservedExamId: "none" });
    useMockModels({ brief: model });

    expect(await lastPrompt(model)).toContain("it can no longer change");
    expect(db.tables.briefs[0]?.reserved_exam_id).toBe(EXAM_2024);
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
