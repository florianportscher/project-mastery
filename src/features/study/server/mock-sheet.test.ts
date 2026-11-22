// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";
import type { Supabase } from "@/lib/supabase/types";

vi.mock("server-only", () => ({}));

const sheet = await import("./mock-sheet");

// The fake stands in for the client, as in the other tests of this folder.
const client = (db: object) => db as unknown as Supabase;
const saveMockAnswer = (
  db: object,
  ...rest: Rest<typeof sheet.saveMockAnswer>
) => sheet.saveMockAnswer(client(db), ...rest);
const startMock = (db: object, mockId: string) =>
  sheet.startMock(client(db), mockId);
const submitMock = (db: object, mockId: string) =>
  sheet.submitMock(client(db), mockId);

type Rest<F> = F extends (first: never, ...rest: infer R) => unknown
  ? R
  : never;

const QUESTION = "aaaaaaaa-0000-4000-8000-000000000001";
const NOW = new Date("2026-11-21T10:00:00Z");

function sheetDb(items: FakeRow[] = [{ id: "i1", question_id: QUESTION }]) {
  return fakeSupabase({
    tables: {
      mock_items: items,
      questions: [{ id: QUESTION, answer_text: null, confidence: null }],
    },
  });
}

describe("saveMockAnswer", () => {
  test("stores the answer, its confidence and when it was given", async () => {
    const db = sheetDb();

    expect(await saveMockAnswer(db, QUESTION, "42", 3, NOW)).toBe("saved");
    expect(db.tables.questions).toMatchObject([
      {
        answer_text: "42",
        confidence: 3,
        answered_at: NOW.toISOString(),
      },
    ]);
  });

  test("stores a blank answer as none", async () => {
    const db = sheetDb();
    await saveMockAnswer(db, QUESTION, "42", 3, NOW);

    expect(await saveMockAnswer(db, QUESTION, "  ", null, NOW)).toBe("saved");
    expect(db.tables.questions).toMatchObject([
      { answer_text: null, confidence: null, answered_at: null },
    ]);
  });

  test("says unknown for a Question no mock item poses", async () => {
    const db = sheetDb([]);

    expect(await saveMockAnswer(db, QUESTION, "42", 3, NOW)).toBe("unknown");
    expect(db.tables.questions).toMatchObject([{ answer_text: null }]);
  });

  test("says closed when the database refuses a mock that stopped running", async () => {
    // The questions_check_mock_answer trigger raises 55000.
    const refused = { data: null, error: { code: "55000", message: "closed" } };
    const chain = (result: unknown): unknown =>
      new Proxy(() => {}, {
        get: (_, key) =>
          key === "then"
            ? (resolve: (value: unknown) => void) => resolve(result)
            : () => chain(result),
      });
    const db = {
      from: (table: string) =>
        table === "mock_items"
          ? chain({ data: { id: "i1" }, error: null })
          : chain(refused),
    } as unknown as Supabase;

    expect(await saveMockAnswer(db, QUESTION, "42", 3, NOW)).toBe("closed");
  });
});

describe("startMock and submitMock", () => {
  const MOCK = "bbbbbbbb-0000-4000-8000-000000000001";
  const db = fakeSupabase({
    tables: {},
    functions: {
      start_mock_exam: (args) => args.p_mock_id === MOCK,
      submit_mock_exam: (args) => args.p_mock_id === MOCK,
    },
  });

  test("tell whether the Student's mock was in the right state", async () => {
    expect(await startMock(db, MOCK)).toBe(true);
    expect(await startMock(db, "other")).toBe(false);
    expect(await submitMock(db, MOCK)).toBe(true);
    expect(await submitMock(db, "other")).toBe(false);
  });

  test("throw when the database fails", async () => {
    const broken = fakeSupabase({ tables: {} });

    await expect(startMock(broken, MOCK)).rejects.toThrow(
      "Starting the mock exam failed",
    );
    await expect(submitMock(broken, MOCK)).rejects.toThrow(
      "Submitting the mock exam failed",
    );
  });
});
