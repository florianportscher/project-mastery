import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { MockResultView } from "./mock-result";

test("a mock with no task graded says it has no score", () => {
  render(
    <MockResultView
      result={{ predictedPercent: 60, scorePercent: null, sure: null } as never}
      tasks={[]}
      tutorHref="/tutor"
    />,
  );
  expect(
    screen.getByText("No task could be graded, so this mock has no score."),
  ).toBeInTheDocument();
  expect(screen.queryByText(/you scored/)).toBeNull();
});
