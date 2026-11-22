// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";

const STUDENT = "11111111-1111-1111-1111-111111111111";
const COURSE = "aaaaaaaa-c000-4000-8000-000000000001";
const CHAT = "cccccccc-0000-4000-8000-000000000001";
const TOPIC = "dddddddd-0000-4000-8000-000000000001";
const ID = "eeeeeeee-0000-4000-8000-000000000001";

let signedIn: string | null = STUDENT;
let db = createDb();

function createDb() {
  return fakeSupabase({
    tables: {
      memories: [] as FakeRow[],
      topics: [{ id: TOPIC, course_id: COURSE, name: "Nozzles" }] as FakeRow[],
      topic_choices: [] as FakeRow[],
    },
    primaryKeys: { memories: ["course_id"], topic_choices: ["topic_id"] },
  });
}

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/user", () => ({
  getUser: async () => (signedIn ? { id: signedIn, email: undefined } : null),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db }));
// The helpers below have their own tests; these tests check what each action
// passes them and answers.
vi.mock("./sessions", () => ({
  closeIdleSession: vi.fn(async () => false),
  endSession: vi.fn(async () => true),
}));
vi.mock("./session-summary", () => ({
  loadSessionSummary: vi.fn(async () => ({ minutes: 5 })),
  saveRating: vi.fn(async () => true),
}));
vi.mock("./problems", () => ({ flagReadyProblem: vi.fn(async () => true) }));
vi.mock("./exam-results", () => ({
  recordExamResult: vi.fn(async () => true),
}));
vi.mock("./mock-assembly", () => ({
  queueMockAssembly: vi.fn(async () => ID),
}));
vi.mock("./mock-grading", () => ({ startMockGrading: vi.fn(async () => {}) }));
vi.mock("./mock-sheet", () => ({
  startMock: vi.fn(async () => true),
  submitMock: vi.fn(async () => true),
  saveMockAnswer: vi.fn(async () => "saved"),
}));
vi.mock("@/features/brief/server", () => ({
  noteInBrief: vi.fn(async () => true),
}));

const { revalidatePath } = await import("next/cache");
const actions = await import("./actions");
const { saveMemory } = actions;
const { getMemory } = await import("./memory");
const sessions = await import("./sessions");
const summary = await import("./session-summary");
const problems = await import("./problems");
const examResults = await import("./exam-results");
const assembly = await import("./mock-assembly");
const grading = await import("./mock-grading");
const sheet = await import("./mock-sheet");
const brief = await import("@/features/brief/server");

beforeEach(() => {
  signedIn = STUDENT;
  db = createDb();
  vi.clearAllMocks();
});

// A refused action reaches no helper, so no one's rows are read or written.
function expectNoHelperCalled() {
  for (const helper of [
    sessions.closeIdleSession,
    sessions.endSession,
    summary.loadSessionSummary,
    summary.saveRating,
    problems.flagReadyProblem,
    examResults.recordExamResult,
    assembly.queueMockAssembly,
    grading.startMockGrading,
    sheet.startMock,
    sheet.submitMock,
    sheet.saveMockAnswer,
    brief.noteInBrief,
  ]) {
    expect(helper).not.toHaveBeenCalled();
  }
}

describe("saveMemory", () => {
  test("creates the Memory, then replaces it, then clears it", async () => {
    expect(await getMemory(COURSE)).toBe("");

    expect(
      await saveMemory({ courseId: COURSE, text: "Likes examples." }),
    ).toEqual({ ok: true, data: undefined });
    expect(await getMemory(COURSE)).toBe("Likes examples.");

    await saveMemory({ courseId: COURSE, text: "Prefers short answers." });
    await saveMemory({ courseId: COURSE, text: "" });
    expect(db.tables.memories).toMatchObject([{ course_id: COURSE, text: "" }]);
    expect(revalidatePath).toHaveBeenLastCalledWith(`/courses/${COURSE}/brief`);
  });

  test("refuses more than 4,000 characters", async () => {
    const result = await saveMemory({
      courseId: COURSE,
      text: "x".repeat(4001),
    });

    expect(result).toMatchObject({ ok: false });
    expect(db.tables.memories).toEqual([]);
  });

  test("refuses a signed-out caller", async () => {
    signedIn = null;

    expect(await saveMemory({ courseId: COURSE, text: "Hi" })).toMatchObject({
      ok: false,
    });
    expect(db.tables.memories).toEqual([]);
  });
});

// Each action refuses a signed-out caller and invalid input before it
// touches anything.
describe.each([
  [
    "endStudySession",
    () => actions.endStudySession({ chatId: CHAT }),
    () => actions.endStudySession({ chatId: "x" }),
  ],
  [
    "getSessionSummary",
    () => actions.getSessionSummary({ chatId: CHAT }),
    () => actions.getSessionSummary({ chatId: "x" }),
  ],
  [
    "rateStudySession",
    () => actions.rateStudySession({ chatId: CHAT, rating: 4 }),
    () => actions.rateStudySession({ chatId: CHAT, rating: 9 }),
  ],
  [
    "flagProblem",
    () => actions.flagProblem({ problemId: ID, flag: "wrong" }),
    () => actions.flagProblem({ problemId: "x", flag: "wrong" }),
  ],
  [
    "queueMockExam",
    () => actions.queueMockExam({ courseId: COURSE }),
    () => actions.queueMockExam({ courseId: "x" }),
  ],
  [
    "startMockExam",
    () => actions.startMockExam({ mockId: ID }),
    () => actions.startMockExam({ mockId: "x" }),
  ],
  [
    "saveMockTaskAnswer",
    () =>
      actions.saveMockTaskAnswer({
        questionId: ID,
        answer: "a",
        confidence: 2,
      }),
    () =>
      actions.saveMockTaskAnswer({
        questionId: ID,
        answer: "a",
        confidence: 7,
      }),
  ],
  [
    "submitMockExam",
    () => actions.submitMockExam({ mockId: ID }),
    () => actions.submitMockExam({ mockId: "x" }),
  ],
  [
    "setTopicChoice",
    () =>
      actions.setTopicChoice({
        courseId: COURSE,
        topicId: TOPIC,
        choice: "pinned",
      }),
    () =>
      actions.setTopicChoice({
        courseId: COURSE,
        topicId: "x",
        choice: "pinned",
      }),
  ],
  [
    "saveExamResult",
    () =>
      actions.saveExamResult({
        courseId: COURSE,
        examDate: "2026-12-01",
        grade: "1.7",
      }),
    () =>
      actions.saveExamResult({
        courseId: COURSE,
        examDate: "soon",
        grade: null,
      }),
  ],
])("%s", (_name, run, runInvalid) => {
  test("refuses a signed-out caller", async () => {
    signedIn = null;

    expect(await run()).toMatchObject({ ok: false });
    expect(db.tables.topic_choices).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
    expectNoHelperCalled();
  });

  test("refuses invalid input", async () => {
    expect(await runInvalid()).toMatchObject({ ok: false });
    expect(db.tables.topic_choices).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
    expectNoHelperCalled();
  });
});

describe("the session actions", () => {
  test("endStudySession ends the Student's session", async () => {
    expect(await actions.endStudySession({ chatId: CHAT })).toEqual({
      ok: true,
      data: undefined,
    });
    expect(sessions.endSession).toHaveBeenCalledWith(
      db,
      CHAT,
      expect.any(String),
    );

    vi.mocked(sessions.endSession).mockResolvedValueOnce(false);
    expect(await actions.endStudySession({ chatId: CHAT })).toMatchObject({
      ok: false,
    });
  });

  test("getSessionSummary returns the summary, or says there is none", async () => {
    expect(await actions.getSessionSummary({ chatId: CHAT })).toEqual({
      ok: true,
      data: { minutes: 5 },
    });
    expect(summary.loadSessionSummary).toHaveBeenCalledWith(db, CHAT);

    vi.mocked(summary.loadSessionSummary).mockResolvedValueOnce(null);
    expect(await actions.getSessionSummary({ chatId: CHAT })).toMatchObject({
      ok: false,
    });
  });

  test("rateStudySession saves the rating, an empty note as none", async () => {
    expect(
      await actions.rateStudySession({ chatId: CHAT, rating: 4, note: " " }),
    ).toEqual({ ok: true, data: undefined });
    expect(summary.saveRating).toHaveBeenCalledWith(db, CHAT, 4, null);

    vi.mocked(summary.saveRating).mockResolvedValueOnce(false);
    expect(
      await actions.rateStudySession({ chatId: CHAT, rating: 4 }),
    ).toMatchObject({ ok: false });
  });
});

describe("flagProblem", () => {
  test("flags a ready Problem once", async () => {
    expect(await actions.flagProblem({ problemId: ID, flag: "wrong" })).toEqual(
      { ok: true, data: undefined },
    );
    expect(problems.flagReadyProblem).toHaveBeenCalledWith(db, ID, "wrong");

    vi.mocked(problems.flagReadyProblem).mockResolvedValueOnce(false);
    expect(
      await actions.flagProblem({ problemId: ID, flag: "wrong" }),
    ).toMatchObject({ ok: false });
  });
});

describe("the mock exam actions", () => {
  test("queueMockExam returns the mock, or says the Course is unknown", async () => {
    expect(await actions.queueMockExam({ courseId: COURSE })).toEqual({
      ok: true,
      data: { mockId: ID },
    });
    expect(assembly.queueMockAssembly).toHaveBeenCalledWith(db, COURSE);

    vi.mocked(assembly.queueMockAssembly).mockResolvedValueOnce(null);
    expect(await actions.queueMockExam({ courseId: COURSE })).toMatchObject({
      ok: false,
    });
  });

  test("startMockExam starts a ready mock only", async () => {
    expect(await actions.startMockExam({ mockId: ID })).toMatchObject({
      ok: true,
    });
    expect(sheet.startMock).toHaveBeenCalledWith(db, ID);

    vi.mocked(sheet.startMock).mockResolvedValueOnce(false);
    expect(await actions.startMockExam({ mockId: ID })).toMatchObject({
      ok: false,
    });
  });

  test("saveMockTaskAnswer reports a closed or unknown task", async () => {
    const input = { questionId: ID, answer: "42", confidence: 3 };
    expect(await actions.saveMockTaskAnswer(input)).toMatchObject({ ok: true });
    expect(sheet.saveMockAnswer).toHaveBeenCalledWith(
      db,
      ID,
      "42",
      3,
      expect.any(Date),
    );

    vi.mocked(sheet.saveMockAnswer).mockResolvedValueOnce("closed");
    expect(await actions.saveMockTaskAnswer(input)).toMatchObject({
      ok: false,
      message: expect.stringContaining("Time is up"),
    });
    vi.mocked(sheet.saveMockAnswer).mockResolvedValueOnce("unknown");
    expect(await actions.saveMockTaskAnswer(input)).toMatchObject({
      ok: false,
      message: "This task was not found.",
    });
  });

  test("submitMockExam starts grading only for a mock that was in progress", async () => {
    expect(await actions.submitMockExam({ mockId: ID })).toMatchObject({
      ok: true,
    });
    expect(grading.startMockGrading).toHaveBeenCalledWith(ID);

    vi.mocked(grading.startMockGrading).mockClear();
    vi.mocked(sheet.submitMock).mockResolvedValueOnce(false);
    expect(await actions.submitMockExam({ mockId: ID })).toMatchObject({
      ok: true,
    });
    expect(grading.startMockGrading).not.toHaveBeenCalled();
  });
});

describe("setTopicChoice", () => {
  const pin = { courseId: COURSE, topicId: TOPIC, choice: "pinned" as const };

  test("pins a Topic, replaces the choice, and clears it", async () => {
    expect(await actions.setTopicChoice(pin)).toEqual({
      ok: true,
      data: { reasonKept: true },
    });
    expect(db.tables.topic_choices).toMatchObject([
      { topic_id: TOPIC, choice: "pinned" },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");

    await actions.setTopicChoice({ ...pin, choice: "skipped" });
    expect(db.tables.topic_choices).toMatchObject([{ choice: "skipped" }]);

    await actions.setTopicChoice({ ...pin, choice: null });
    expect(db.tables.topic_choices).toEqual([]);
  });

  test("keeps a skip's reason in the Brief", async () => {
    await actions.setTopicChoice({
      ...pin,
      choice: "skipped",
      reason: "Not on the exam",
    });
    expect(brief.noteInBrief).toHaveBeenCalledWith(
      db,
      COURSE,
      "Skipped Nozzles: Not on the exam",
    );
  });

  test("refuses a Topic of another Course", async () => {
    const other = "aaaaaaaa-c000-4000-8000-000000000002";
    expect(await actions.setTopicChoice({ ...pin, courseId: other })).toEqual({
      ok: false,
      message: "This Topic was not found.",
    });
    expect(db.tables.topic_choices).toEqual([]);
  });
});

describe("saveExamResult", () => {
  test("stores the grade and revalidates, or says the Course is unknown", async () => {
    const input = { courseId: COURSE, examDate: "2026-12-01", grade: "1.7" };
    expect(await actions.saveExamResult(input)).toEqual({
      ok: true,
      data: undefined,
    });
    expect(examResults.recordExamResult).toHaveBeenCalledWith(db, input);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");

    vi.mocked(revalidatePath).mockClear();
    vi.mocked(examResults.recordExamResult).mockResolvedValueOnce(false);
    expect(await actions.saveExamResult(input)).toMatchObject({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
