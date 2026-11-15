import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { DemoWelcome } from "./demo-welcome";

const links = { briefHref: "/b", chatHref: "/c" };

beforeEach(() => {
  localStorage.clear();
});

describe("DemoWelcome", () => {
  test("names the sample Course and links its Materials", () => {
    render(
      <DemoWelcome
        courseName="Linear Algebra I"
        materialsHref="/m"
        {...links}
      />,
    );
    const region = screen.getByRole("region", { name: "Demo welcome" });
    expect(region).toHaveTextContent("Linear Algebra I");
    for (const [name, href] of [
      ["Materials", "/m"],
      ["Brief", "/b"],
      ["New chat", "/c"],
    ]) {
      for (const link of screen.getAllByRole("link", { name })) {
        expect(link).toHaveAttribute("href", href);
      }
    }
  });

  test("stays closed once closed", () => {
    const { unmount } = render(
      <DemoWelcome courseName="LA" materialsHref="/m" {...links} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close the welcome" }));
    expect(screen.queryByRole("region", { name: "Demo welcome" })).toBeNull();
    unmount();
    render(<DemoWelcome courseName="LA" materialsHref="/m" {...links} />);
    expect(screen.queryByRole("region", { name: "Demo welcome" })).toBeNull();
  });
});
