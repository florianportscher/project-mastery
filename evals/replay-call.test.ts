import { describe, expect, it } from "vitest";
import {
  archivedAnswer,
  archivedPrompt,
  compareLine,
  offeredData,
  ReplayError,
  toModelMessages,
} from "./replay-call";

// A Chat reply's second step, as Langfuse archived it: the system prompt,
// the Student's message, a tool call with its result, and the tools offered.
const chatInput = JSON.stringify({
  messages: [
    { role: "system", content: "You tutor." },
    { role: "user", parts: [{ type: "text", content: "Let's start." }] },
    {
      role: "assistant",
      parts: [
        { type: "reasoning", content: "" },
        { type: "text", content: "Reading the Topic." },
        {
          type: "tool_call",
          id: "call_1",
          name: "getTopic",
          arguments: { topicId: "t1" },
        },
      ],
    },
    {
      role: "tool",
      parts: [
        { type: "tool_call_response", id: "call_1", response: { id: "t1" } },
      ],
    },
  ],
  tools: [
    {
      type: "function",
      name: "getTopic",
      description: "Read a Topic.",
      inputSchema: { type: "object" },
    },
  ],
});

describe("archivedPrompt and toModelMessages", () => {
  it("splits off the system prompt and the tools", () => {
    const prompt = archivedPrompt(chatInput);
    expect(prompt.system).toBe("You tutor.");
    expect(prompt.tools.map((t) => t.name)).toEqual(["getTopic"]);
    expect(prompt.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "tool",
    ]);
  });

  it("turns tool calls and results into model messages, without reasoning", () => {
    const messages = toModelMessages(archivedPrompt(chatInput).messages);
    expect(messages).toEqual([
      { role: "user", content: [{ type: "text", text: "Let's start." }] },
      {
        role: "assistant",
        content: [
          { type: "text", text: "Reading the Topic." },
          {
            type: "tool-call",
            toolCallId: "call_1",
            toolName: "getTopic",
            input: { topicId: "t1" },
          },
        ],
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "call_1",
            toolName: "getTopic",
            output: { type: "json", value: { id: "t1" } },
          },
        ],
      },
    ]);
  });

  it("refuses a call that sent page images", () => {
    const pageRead = [
      {
        role: "user",
        parts: [
          { type: "text", content: "Page 3" },
          { type: "file", material: "ab", page: 3 },
        ],
      },
    ];
    expect(() => toModelMessages(pageRead)).toThrow(ReplayError);
  });
});

describe("offeredData", () => {
  it("reads a build call's data from its user message", () => {
    const { messages } = archivedPrompt([
      { role: "system", content: "Extract KCs." },
      { role: "user", parts: [{ type: "text", content: '{"chunks":[1,2]}' }] },
    ]);
    expect(offeredData(messages)).toEqual({ chunks: [1, 2] });
  });

  it("refuses a user message that is not JSON", () => {
    const { messages } = archivedPrompt([
      { role: "user", parts: [{ type: "text", content: "hello" }] },
    ]);
    expect(() => offeredData(messages)).toThrow(ReplayError);
  });
});

describe("archivedAnswer and compareLine", () => {
  it("compares lengths, tool calls and list counts", () => {
    const before = archivedAnswer(
      JSON.stringify([
        {
          role: "assistant",
          parts: [{ type: "text", content: '{"kcs":[1,2,3],"note":"x"}' }],
        },
      ]),
    );
    expect(before.json).toEqual({ kcs: [1, 2, 3], note: "x" });
    const after = {
      text: '{"kcs":[1]}',
      toolCalls: [{ name: "ask", input: {} }],
      json: { kcs: [1] },
    };
    expect(compareLine(before, after)).toBe(
      "text 26 → 11 chars · tools none → ask · kcs 3 → 1",
    );
  });
});
