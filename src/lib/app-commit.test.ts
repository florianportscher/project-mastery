// @vitest-environment node
import { expect, test, vi } from "vitest";

test("uses the deployed commit, shortened, and reads it once", async () => {
  vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123456789abcdef");
  vi.resetModules();
  const { appCommit } = await import("./app-commit");
  expect(appCommit()).toBe("0123456");
  vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "fffffffffff");
  expect(appCommit()).toBe("0123456");
  vi.unstubAllEnvs();
});
