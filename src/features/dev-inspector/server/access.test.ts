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

const { requireDeveloper } = await import("./access");
const { loadChunkMarkdown } = await import("./actions");

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

  test("production gets 404, developer or not", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(requireDeveloper("/dev")).rejects.toThrow("notFound");
    await expect(loadChunkMarkdown({ chunkId: CHUNK })).resolves.toMatchObject({
      ok: false,
    });
  });
});
