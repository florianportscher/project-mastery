import { expect, test } from "vitest";
import { messageText, replyErrorMessage } from "./reply";

test("joins the text parts of a message and skips other parts", () => {
  expect(
    messageText([
      { type: "step-start" },
      { type: "text", text: "The first step " },
      { type: "text", text: "is to differentiate." },
    ]),
  ).toBe("The first step is to differentiate.");
});

test("an invalid tool call's error keeps its message, also as a string", () => {
  // The form the AI SDK passes for the call's own part (verified 2026-11-09).
  const text =
    "AI_InvalidToolInputError: Invalid input for tool grade: results is required";
  expect(replyErrorMessage(text)).toBe(text);
});

test("AI Gateway's rate limit, which is no APICallError, tells the Student the AI is busy", () => {
  // The shape of `GatewayRateLimitError` from @ai-sdk/gateway.
  const rateLimit = Object.assign(new Error("Rate limit exceeded"), {
    name: "GatewayRateLimitError",
    statusCode: 429,
  });
  expect(replyErrorMessage(rateLimit)).toBe(
    "The AI is busy right now. Please try again in a moment.",
  );
});

test("any other error becomes the generic message", () => {
  expect(replyErrorMessage("connection reset")).toBe(
    "The AI could not reply. Please try again.",
  );
  expect(replyErrorMessage(new Error("boom"))).toBe(
    "The AI could not reply. Please try again.",
  );
});
