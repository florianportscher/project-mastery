import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { QuickReplies } from "./quick-replies";

const replies = ["Show me an example.", "Let's wrap up."];

test("each button sends its fixed message", () => {
  const onSend = vi.fn();
  render(<QuickReplies replies={replies} visible onSend={onSend} />);
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(
    replies,
  );
  fireEvent.click(screen.getByRole("button", { name: "Let's wrap up." }));
  expect(onSend).toHaveBeenCalledWith("Let's wrap up.");
});

test("shows nothing while hidden", () => {
  render(<QuickReplies replies={replies} visible={false} onSend={vi.fn()} />);
  expect(screen.queryByRole("button")).toBeNull();
});
