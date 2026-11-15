import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { DemoWelcome } from "./demo-welcome";

beforeEach(() => {
  localStorage.clear();
});

describe("DemoWelcome", () => {
  test("names the sample Course and links its Materials", () => {
    render(<DemoWelcome courseName="Linear Algebra I" materialsHref="/m" />);
    const region = screen.getByRole("region", { name: "Demo welcome" });
    expect(region).toHaveTextContent("Linear Algebra I");
    expect(screen.getByRole("link", { name: "Materials" })).toHaveAttribute(
      "href",
      "/m",
    );
  });

  test("stays closed once closed", () => {
    const { unmount } = render(
      <DemoWelcome courseName="LA" materialsHref="/m" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close the welcome" }));
    expect(screen.queryByRole("region", { name: "Demo welcome" })).toBeNull();
    unmount();
    render(<DemoWelcome courseName="LA" materialsHref="/m" />);
    expect(screen.queryByRole("region", { name: "Demo welcome" })).toBeNull();
  });
});
