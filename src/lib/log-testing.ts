import { onTestFinished, vi } from "vitest";

/**
 * Silences the given console methods for the running test only. For tests of
 * a failure the code handles by logging it. A test where the log is the claim
 * spies on the method itself and asserts on it.
 */
export function silenceLogs(...methods: Array<"error" | "warn">) {
  for (const method of methods) {
    const spy = vi.spyOn(console, method).mockImplementation(() => {});
    onTestFinished(() => spy.mockRestore());
  }
}
