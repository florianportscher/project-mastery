// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { listTracedCalls } from "./observations";

const getMany = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@langfuse/client", () => ({
  LangfuseClient: class {
    api = { observations: { getMany } };
  },
}));

const observation = (id: string, parent: string | null, startTime: string) => ({
  id,
  parentObservationId: parent,
  name: "embeddings",
  startTime,
  endTime: null,
  metadata: { "attributes.langfuse.trace.name": "embed-kcs" },
});

beforeEach(() => {
  getMany.mockReset();
  vi.stubEnv("LANGFUSE_PUBLIC_KEY", "pk-lf-test");
  vi.stubEnv("LANGFUSE_SECRET_KEY", "sk-lf-test");
});

describe("listTracedCalls", () => {
  test("lists an embedMany call once, by its provider span", async () => {
    getMany.mockResolvedValue({
      data: [
        observation("inner", "outer", "t2"),
        observation("outer", "wrapper", "t1"),
      ],
      meta: { cursor: null },
    });

    const listed = await listTracedCalls("courseId", "c1");

    expect(listed?.calls.map((call) => call.id)).toEqual(["inner"]);
    expect(listed?.truncated).toBe(false);
  });

  test("says when pages beyond the cap were left out", async () => {
    getMany.mockResolvedValue({
      data: Array.from({ length: 1000 }, (_, i) =>
        observation(`o${i}`, null, "t"),
      ),
      meta: { cursor: "next" },
    });

    const listed = await listTracedCalls("courseId", "c1");

    expect(listed?.truncated).toBe(true);
  });
});
