import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("paceCall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    vi.stubEnv("AI_PROVIDER", "mock");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  test("with AI_RPM=5, six calls start over a minute apart", async () => {
    vi.stubEnv("AI_RPM", "5");
    const { paceCall } = await import("./pacing");
    const startedAt = Date.now();
    const starts: number[] = [];
    const calls = Array.from({ length: 6 }, () =>
      paceCall().then(() => starts.push(Date.now() - startedAt)),
    );
    await vi.runAllTimersAsync();
    await Promise.all(calls);
    expect(starts).toEqual([0, 12_000, 24_000, 36_000, 48_000, 60_000]);
  });

  test("it returns the time waited", async () => {
    vi.stubEnv("AI_RPM", "5");
    const { paceCall } = await import("./pacing");
    const waits = [paceCall(), paceCall()];
    await vi.runAllTimersAsync();
    expect(await Promise.all(waits)).toEqual([0, 12_000]);
  });

  test("without AI_RPM, calls start at once", async () => {
    vi.stubEnv("AI_RPM", "");
    const { paceCall } = await import("./pacing");
    await paceCall();
    await paceCall();
    expect(vi.getTimerCount()).toBe(0);
  });
});
