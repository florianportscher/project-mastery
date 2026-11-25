import { describe, expect, it } from "vitest";
import { citedObservations, transcript } from "./case";

describe("citedObservations", () => {
  it("adds issues once, in order, with or without #", () => {
    expect(citedObservations([419, 417], ["#418", "417"])).toEqual([
      417, 418, 419,
    ]);
  });

  it("refuses what is no issue number", () => {
    expect(() => citedObservations([], ["abc"])).toThrow("Not issue numbers");
  });
});

const messages = [
  {
    role: "user",
    created_at: "2026-11-24T13:28:36Z",
    parts: [{ type: "text", text: "Let's start." }],
  },
  {
    role: "assistant",
    created_at: "2026-11-24T13:28:49Z",
    parts: [
      { type: "reasoning", text: "thinking" },
      { type: "text", text: "Here is a task." },
      {
        type: "tool-ask",
        state: "output-available",
        input: { kcIds: ["k1", "k2"], prompt: "a) one\nb) two" },
      },
      {
        type: "tool-getTopic",
        state: "output-error",
        errorText: "not found",
        input: { topicId: "t1" },
      },
    ],
  },
  {
    role: "user",
    created_at: "2026-11-24T13:48:00Z",
    parts: [{ type: "text", text: "a) yes b) no" }],
  },
  {
    role: "assistant",
    created_at: "2026-11-24T13:48:12Z",
    parts: [{ type: "text", text: "Right." }],
  },
];

const calls = [
  {
    id: "aaaaaaaa1",
    traceName: "chat-reply",
    startTime: "2026-11-24T13:28:37Z",
  },
  {
    id: "bbbbbbbb2",
    traceName: "chat-reply",
    startTime: "2026-11-24T13:28:39Z",
  },
  {
    id: "tttttttt3",
    traceName: "chat-title",
    startTime: "2026-11-24T13:28:49Z",
  },
  {
    id: "cccccccc4",
    traceName: "chat-reply",
    startTime: "2026-11-24T13:48:02Z",
  },
];

describe("transcript", () => {
  const text = transcript(messages, calls).join("\n");

  it("names under each reply the reply calls made after the Student's message", () => {
    expect(text).toContain("13:28 AI (15 chars; calls aaaaaaaa bbbbbbbb):");
    expect(text).toContain("13:48 AI (6 chars; calls cccccccc):");
  });

  it("shows a Question in full with its KC count, and a failed tool call", () => {
    expect(text).toContain("  [ask, 2 KCs]\n    a) one\n    b) two");
    expect(text).toContain('  [getTopic] FAILED not found {"topicId":"t1"}');
  });

  it("leaves out reasoning", () => {
    expect(text).not.toContain("thinking");
  });
});
