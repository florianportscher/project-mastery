import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ThemeProvider } from "./theme-provider";

test("rendering the provider on the client logs no script-tag warning", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addListener() {},
    removeListener() {},
  }));
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ThemeProvider>
      <p>Hi</p>
    </ThemeProvider>,
  );
  const warnings = error.mock.calls.filter((call) =>
    call.some((part) => String(part).includes("script")),
  );
  expect(warnings).toEqual([]);
  error.mockRestore();
});
