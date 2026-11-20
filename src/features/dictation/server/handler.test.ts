// @vitest-environment node
import { MockTranscriptionModelV4 } from "ai/test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockTranscriptionModel, useMockModels } from "@/lib/ai/testing";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";

vi.mock("server-only", () => ({}));

const STUDENT = "11111111-1111-1111-1111-111111111111";
let signedIn: string | null = STUDENT;
let db = createDb();

function createDb() {
  return fakeSupabase({
    tables: { ai_usage: [] as FakeRow[] },
    defaults: {
      ai_usage: () => ({
        owner: signedIn,
        created_at: new Date().toISOString(),
      }),
    },
    canAccess: (_table, row) => row.owner === signedIn,
  });
}

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/auth/user", () => ({
  getUser: async () => (signedIn ? { id: signedIn, email: undefined } : null),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db }));

beforeEach(() => {
  signedIn = STUDENT;
  db = createDb();
  vi.stubEnv("AI_DAILY_LIMIT_USD", "");
});

async function dictate(bytes = 1000) {
  const { handleDictationRequest } = await import("./handler");
  return handleDictationRequest(
    new Request("http://localhost/api/dictation", {
      method: "POST",
      headers: { "content-type": "audio/webm;codecs=opus" },
      body: new Uint8Array(bytes),
    }),
  );
}

describe("a Dictation", () => {
  test("answers the text and records one cost priced by the audio's length", async () => {
    useMockModels({ transcribe: mockTranscriptionModel(" Hello. ", 40) });

    const response = await dictate();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: "Hello." });
    expect(db.tables.ai_usage).toEqual([
      expect.objectContaining({
        owner: STUDENT,
        task: "transcribe",
        model_id: "openai/gpt-transcribe",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: expect.closeTo(0.003, 9), // 40 s at $0.27 per hour
        estimated: false,
      }),
    ]);
  });

  test("without a reported duration, prices 2 minutes as an estimate", async () => {
    useMockModels({ transcribe: mockTranscriptionModel("Hi.", undefined) });

    await dictate();

    expect(db.tables.ai_usage).toEqual([
      expect.objectContaining({
        cost_usd: expect.closeTo(0.009, 9),
        estimated: true,
      }),
    ]);
  });

  test("a model error answers 502 and records nothing", async () => {
    useMockModels({
      transcribe: new MockTranscriptionModelV4({
        doGenerate: async () => {
          throw new Error("Model unavailable");
        },
      }),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await dictate();

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("Couldn't transcribe that. Try again.");
    expect(db.tables.ai_usage).toEqual([]);
  });
});

test.each([
  {
    refused: "a signed-out request",
    status: 401,
    bytes: 1000,
    setup: () => (signedIn = null),
  },
  {
    refused: "a recording over 4 MB",
    status: 413,
    bytes: 4 * 1024 * 1024 + 1,
    setup: () => {},
  },
  {
    refused: "a request at the Daily limit",
    status: 429,
    bytes: 1000,
    setup: () => {
      vi.stubEnv("AI_DAILY_LIMIT_USD", "0.01");
      db.tables.ai_usage.push({
        owner: STUDENT,
        cost_usd: 0.02,
        created_at: new Date().toISOString(),
      });
    },
  },
])("refuses $refused with $status, without a model call", async (cases) => {
  const doGenerate = vi.fn();
  useMockModels({ transcribe: new MockTranscriptionModelV4({ doGenerate }) });
  cases.setup();

  expect((await dictate(cases.bytes)).status).toBe(cases.status);
  expect(doGenerate).not.toHaveBeenCalled();
});
