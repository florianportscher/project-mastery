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

  test("keeps the provider the caller set", () => {
    expect(devServerEnv({ AI_PROVIDER: "gateway" }).AI_PROVIDER).toBe(
      "gateway",
    );
  });
});
