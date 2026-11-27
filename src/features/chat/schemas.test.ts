// @vitest-environment node
import { expect, test, vi } from "vitest";
import { chatMessageMetadataSchema } from "./schemas";

vi.mock("server-only", () => ({}));

test("a stored tutor context without a Course language still parses", () => {
  const stored = { today: "2026-11-07", goal: null, session: {} };
  expect(
    chatMessageMetadataSchema.parse({ tutorContext: stored })?.tutorContext,
  ).toEqual(stored);
});
