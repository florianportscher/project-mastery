// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { TimeLimitError, withinTime } = await import("./time-limit");

describe("withinTime", () => {
  test("returns what the code returns", () => {
    expect(withinTime(1000, () => [1, 2])).toEqual([1, 2]);
  });

  test("passes on what the code throws", () => {
    class OwnError extends Error {}

    expect(() =>
      withinTime(1000, () => {
        throw new OwnError("no");
      }),
    ).toThrow(OwnError);
  });

  test("stops code that runs over its limit", () => {
    const started = Date.now();

    expect(() =>
      withinTime(50, () => {
        for (;;);
      }),
    ).toThrow(TimeLimitError);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  test("runs the next call after a stopped one", () => {
    expect(() =>
      withinTime(50, () => {
        for (;;);
      }),
    ).toThrow(TimeLimitError);

    expect(withinTime(1000, () => "done")).toBe("done");
  });
});
