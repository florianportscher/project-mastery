import { expect, test } from "vitest";
import {
  answerText,
  questionStates,
} from "@/features/chat/domain/question-states";
import type { ChatUIMessage } from "@/features/chat/types";

const reply = (toolName: string, output: unknown): ChatUIMessage => ({
  id: crypto.randomUUID(),
  role: "assistant",
  parts: [
    {
      type: `tool-${toolName}`,
      toolCallId: crypto.randomUUID(),
      state: "output-available",
      input: {},
      output,
    } as ChatUIMessage["parts"][number],
  ],
});

const typed = (text: string): ChatUIMessage => ({
  id: crypto.randomUUID(),
  role: "user",
  parts: [{ type: "text", text }],
});

const submit = (questionId: string): ChatUIMessage => ({
  ...typed("Part 1: 4"),
  metadata: {
    answer: { questionId, parts: [{ position: 1, text: "4", choice: null }] },
  },
});

test("the newest Question is open until its Submit; a side question leaves it open", () => {
  const asked = [reply("ask", { questionId: "q1" }), typed("Why?")];
  expect(questionStates(asked).get("q1")?.open).toBe(true);

  const state = questionStates([...asked, submit("q1")]).get("q1");
  expect(state?.open).toBe(false);
  expect(state?.answers?.get(1)?.text).toBe("4");
});

test("a grade shows each part's verdict; a later ask closes the earlier Question", () => {
  const states = questionStates([
    reply("ask", { questionId: "q1" }),
    submit("q1"),
    reply("grade", {
      questionId: "q1",
      parts: [{ position: 1, result: "wrong", note: "Check it." }],
    }),
    reply("ask", { questionId: "q2" }),
  ]);
  expect(states.get("q1")?.verdicts?.get(1)).toMatchObject({
    result: "wrong",
    note: "Check it.",
  });
  expect(states.get("q1")?.open).toBe(false);
  expect(states.get("q2")?.open).toBe(true);
});

test("closeQuestion closes the newest Question", () => {
  const states = questionStates([
    reply("ask", { questionId: "q1" }),
    reply("closeQuestion", { ok: true }),
  ]);
  expect(states.get("q1")?.open).toBe(false);
});

test("a Submit's text names each part, and an empty one as not answered", () => {
  expect(
    answerText([
      { position: 1, text: " 4 ", choice: null },
      { position: 2, text: "", choice: null },
    ]),
  ).toBe("Part 1: 4\n\nPart 2: (not answered)");
});
