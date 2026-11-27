import { expect, test, vi } from "vitest";
import { chatTitleSettings } from "./title";

vi.mock("server-only", () => ({}));

test("the title call falls back to the Course language for a fixed message", () => {
  expect(chatTitleSettings("German").instructions).toContain(
    'or in German when the message is a fixed English button text such as "Let\'s start."',
  );
  expect(chatTitleSettings().instructions).not.toContain("button text");
});
