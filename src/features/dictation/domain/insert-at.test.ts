import { expect, test } from "vitest";
import { insertAt } from "./insert-at";

test("fills an empty box", () => {
  expect(insertAt("", 0, 0, "Hi.")).toEqual({ text: "Hi.", caret: 3 });
});

test("appends after text with a space", () => {
  expect(insertAt("Hello", 5, 5, "A.")).toEqual({
    text: "Hello A.",
    caret: 8,
  });
});

test("splits a word at the cursor with spaces on both sides", () => {
  expect(insertAt("Hello world", 3, 3, "X")).toEqual({
    text: "Hel X lo world",
    caret: 5,
  });
});

test("adds no space next to whitespace", () => {
  expect(insertAt("Question: done", 9, 9, "Yes.")).toEqual({
    text: "Question: Yes. done",
    caret: 14,
  });
  expect(insertAt("Question:", 0, 0, "Yes.")).toEqual({
    text: "Yes. Question:",
    caret: 4,
  });
});

test("replaces the selection", () => {
  expect(insertAt("Question: done", 10, 14, "Yes.")).toEqual({
    text: "Question: Yes.",
    caret: 14,
  });
});
