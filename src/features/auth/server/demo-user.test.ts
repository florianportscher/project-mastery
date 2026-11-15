// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/user", () => ({ getUser }));

const { isDemoUser } = await import("./demo-user");

beforeEach(() => {
  vi.stubEnv("DEMO_EMAIL", "demo@example.com");
  vi.stubEnv("DEMO_PASSWORD", "demo-password");
  getUser.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDemoUser", () => {
  test("is true for the demo account, in any case", async () => {
    getUser.mockResolvedValue({ id: "u", email: "Demo@Example.com" });
    expect(await isDemoUser()).toBe(true);
  });

  test("is false for another Student or when signed out", async () => {
    getUser.mockResolvedValue({ id: "u", email: "student@example.com" });
    expect(await isDemoUser()).toBe(false);
    getUser.mockResolvedValue(null);
    expect(await isDemoUser()).toBe(false);
  });

  test("is false when the demo is off", async () => {
    vi.stubEnv("DEMO_EMAIL", "");
    getUser.mockResolvedValue({ id: "u", email: "demo@example.com" });
    expect(await isDemoUser()).toBe(false);
  });
});
