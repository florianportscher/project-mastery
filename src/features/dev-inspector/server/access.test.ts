// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fakeSupabase } from "@/lib/supabase/testing";

const DEV = "11111111-1111-1111-1111-111111111111";
const STUDENT = "22222222-2222-2222-2222-222222222222";
const CHUNK = "cccccccc-0000-4000-8000-000000000001";
let signedIn = DEV;

const db = fakeSupabase({
  tables: {
    developers: [{ user_id: DEV }],
    chunks: [{ id: CHUNK, owner: DEV, markdown: "A vector." }],
    courses: [
      { id: "course-dev", owner: DEV },
      { id: "course-student", owner: STUDENT },
    ],
  },
  // As the policies: own developer row, own chunks.
  canAccess: (table, row) =>
    (table === "developers" ? row.user_id : row.owner) === signedIn,
});

vi.mock("server-only", () => ({}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock("@/lib/auth/user", () => ({
  getUser: async () => ({ id: signedIn, email: undefined }),
  requireUser: async () => ({ id: signedIn, email: undefined }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

// Langfuse: one call per Course, its id the Course's.
vi.mock("@/lib/tracing/observations", () => ({
  getTracedCall: async (id: string) => ({
    id,
    name: "extract-chapter",
    model: null,
    startTime: "2026-11-20T10:00:00Z",
    endTime: null,
    level: "DEFAULT",
    statusMessage: null,
    inputTokens: 1,
    outputTokens: 1,
    cost: null,
    metadata: { courseId: id, unitKey: "c/content/0" },
    input: "prompt",
    output: "answer",
  }),
}));

const { requireDeveloper } = await import("./access");
const { loadCallDetail, loadChunkMarkdown } = await import("./actions");

beforeEach(() => {
  signedIn = DEV;
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the developer view's access", () => {
  test("a developer gets the page and a chunk's Markdown", async () => {
    await expect(requireDeveloper("/dev")).resolves.toMatchObject({ id: DEV });
    await expect(loadChunkMarkdown({ chunkId: CHUNK })).resolves.toEqual({
      ok: true,
      data: "A vector.",
    });
  });

  test("another account gets 404", async () => {
    signedIn = STUDENT;
    await expect(requireDeveloper("/dev")).rejects.toThrow("notFound");
    await expect(loadChunkMarkdown({ chunkId: CHUNK })).resolves.toEqual({
      ok: false,
      message: "Not found.",
    });
  });

  test("a developer opens calls of their own Courses only", async () => {
    await expect(
      loadCallDetail({ callId: "course-dev" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { input: "prompt", output: "answer", unitKey: "c/content/0" },
    });
    await expect(loadCallDetail({ callId: "course-student" })).resolves.toEqual(
      { ok: false, message: "Not found." },
    );
    signedIn = STUDENT;
    await expect(loadCallDetail({ callId: "course-student" })).resolves.toEqual(
      { ok: false, message: "Not found." },
    );
  });

  test("production gets 404, developer or not", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(requireDeveloper("/dev")).rejects.toThrow("notFound");
    await expect(loadChunkMarkdown({ chunkId: CHUNK })).resolves.toMatchObject({
      ok: false,
    });
  });
});
