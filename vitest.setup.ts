import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// The code logs the failures it handles, and tests of those paths would print
// them. A test where the log is the claim asserts on its own spy.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(console.error).mockClear();
  vi.mocked(console.warn).mockClear();
});

afterEach(() => {
  cleanup();
});
