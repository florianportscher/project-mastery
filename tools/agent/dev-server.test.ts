// @vitest-environment node
import { describe, expect, test } from "vitest";
import { devServerEnv } from "./dev-server";

describe("devServerEnv", () => {
  test("uses the mock provider when the caller sets none", () => {
    expect(devServerEnv({ PATH: "/bin" })).toEqual({
      PATH: "/bin",
      AI_PROVIDER: "mock",
    });
  });

  test("uses the mock even when the environment names a live provider", () => {
    expect(devServerEnv({ AI_PROVIDER: "gateway" }).AI_PROVIDER).toBe("mock");
  });

  test("keeps the provider of the environment with live", () => {
    expect(devServerEnv({ AI_PROVIDER: "gateway" }, true).AI_PROVIDER).toBe(
      "gateway",
    );
  });
});
