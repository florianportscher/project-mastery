// @vitest-environment node
// The chat handler's Questions (#251, #448): ask in parts, Submit and grade
// on the session's open Question, the session facts in the tutor context,
// and a session that goes through a graded Mock exam. Shared setup and
// helpers: handler-testing.ts.
import { randomUUID } from "node:crypto";
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { expect, test, vi } from "vitest";
import { mockTextModel, mockToolModel, useMockModels } from "@/lib/ai/testing";
import {
  COURSE,
  MAP,
  STUDENT,
  db,
  moveMessage,
  seedMap,
  send,
  submitMessage,
  userMessage,
} from "./handler-testing";

vi.mock("server-only", () => ({}));

type Model = ReturnType<typeof mockTextModel>;

const asking = (kcIds: string[] = [MAP.thrust, MAP.efficiency]) =>
  mockToolModel(
    [
      [
        {
          toolName: "ask",
          input: {
            prompt: "A jet engine.",
            parts: kcIds.map((kcId, index) => ({
              prompt: `Part ${index + 1}?`,
              kcId,
              form: "short",
              options: null,
            })),
          },
        },
      ],
    ],
    "",
  );

/** Grades parts 1, 2, … with `verdicts`. */
const grading = (verdicts: string[], text = "Well done.") =>
  mockToolModel(
    [
      [
        {
          toolName: "grade",
          input: {
            results: verdicts.map((result, index) => ({
              position: index + 1,
              result,
              note: `Note ${index + 1}.`,
            })),
            help: "some",
          },
        },
      ],
    ],
    text,
  );

/**
 * A new Chat whose first reply asks a question on `kcIds`. Named as a hook
 * for the lint rule, since it sets the mock models.
 */
function useAskedChat(kcIds?: string[]): Promise<string> {
  seedMap();
  const chatId = randomUUID();
  useMockModels({ chat: asking(kcIds) });
  return send({
    chatId,
    courseId: COURSE,
    message: userMessage("Quiz me"),
  }).then(() => chatId);
}

/** Types a message in the Chat with `model` replying. */
function useReply(chatId: string, model: Model, text = "What's thrust?") {
  useMockModels({ chat: model });
  return send({ chatId, message: userMessage(text) });
}

const newestQuestion = () => db.tables.questions.at(-1)!;

/** Submits `texts` to the newest Question with `model` replying. */
function useSubmit(
  chatId: string,
  model: Model,
  texts = ["Mass flow.", "Velocity."],
  questionId = newestQuestion().id as string,
) {
  useMockModels({ chat: model });
  return send({ chatId, message: submitMessage(questionId, texts) });
}

const toolError = (toolName: string) =>
  (
    db.tables.chat_messages.at(-1)!.parts as Array<{
      type: string;
      toolName?: string;
      errorText?: string;
    }>
  ).find(
    // A call whose input failed the schema is stored as a dynamic tool.
    (part) =>
      part.type === `tool-${toolName}` ||
      (part.type === "dynamic-tool" && part.toolName === toolName),
  )?.errorText;

const newestUserText = (model: Model, call = 0) =>
  JSON.stringify(
    model.doStreamCalls[call]!.prompt.findLast(({ role }) => role === "user"),
  );

const storedParts = () =>
  db.tables.question_parts
    .toSorted((a, b) => (a.position as number) - (b.position as number))
    .map(({ position, kc_id, form, answer_text, result, note }) => ({
      position,
      kc_id,
      form,
      answer_text,
      result,
      note,
    }));

test("ask stores the parts, a Submit their answers, and grade a result per part and an Attempt per KC", async () => {
  const chatId = await useAskedChat();
  expect(storedParts()).toEqual([
    expect.objectContaining({ position: 1, kc_id: MAP.thrust, form: "short" }),
    expect.objectContaining({ position: 2, kc_id: MAP.efficiency }),
  ]);

  // Answered but ungraded: a new question is refused.
  await useSubmit(chatId, asking(), ["Mass flow.", ""]);
  expect(toolError("ask")).toContain("grade it first");
  expect(db.tables.questions).toHaveLength(1);
  expect(newestQuestion()).toMatchObject({
    answer_text: "Part 1: Mass flow.\n\nPart 2: ",
    answer_message_id: db.tables.chat_messages.at(-2)!.id,
  });
  expect(db.tables.chat_messages.at(-2)!.answer).toEqual(
    expect.objectContaining({ questionId: newestQuestion().id }),
  );
  expect(storedParts().map(({ answer_text }) => answer_text)).toEqual([
    "Mass flow.",
    null,
  ]);

  await useReply(chatId, grading(["full", "unanswered"]), "Did I get it?");

  expect(storedParts().map(({ result, note }) => [result, note])).toEqual([
    ["full", "Note 1."],
    ["unanswered", "Note 2."],
  ]);
  // Efficiency has only an unanswered part: no Attempt.
  expect(db.tables.attempts).toEqual([
    expect.objectContaining({
      kc_id: MAP.thrust,
      result: "full",
      help: "some",
    }),
  ]);
  expect(newestQuestion().graded_at).not.toBeNull();
});

test("a typed message is a side question: the Question stays open", async () => {
  const chatId = await useAskedChat();

  await useReply(chatId, mockTextModel("Thrust is a force."));

  expect(newestQuestion().answered_at).toBeNull();
  await useReply(chatId, grading(["full", "full"]));
  expect(toolError("grade")).toContain("not answered");
});

test("a Submit is refused for a Question that is answered, or isn't the newest", async () => {
  const chatId = await useAskedChat();
  const missingPart = await useSubmit(chatId, mockTextModel("Thanks."), ["X"]);
  await useSubmit(chatId, mockTextModel("Thanks."));
  const answered = newestQuestion().answered_at;

  const again = await useSubmit(chatId, mockTextModel("Thanks."), ["X", "Y"]);
  const other = await useSubmit(
    chatId,
    mockTextModel("Thanks."),
    ["X", "Y"],
    randomUUID(),
  );

  expect([again.status, other.status, missingPart.status]).toEqual([
    409, 409, 409,
  ]);
  expect(again.refusal).toContain("no longer open");
  expect(missingPart.refusal).toContain("parts");
  expect(db.tables.questions[0]!.answered_at).toBe(answered);
  expect(db.tables.question_parts[0]!.answer_text).toBe("Mass flow.");
});

test("a press counts a hint or the shown solution on its part, and the reply's context has it", async () => {
  const chatId = await useAskedChat();
  const questionId = newestQuestion().id;
  const press = (kind: "hint" | "solution", position: number, draft?: string) =>
    send({ chatId, message: moveMessage(questionId, kind, position, draft) });

  useMockModels({ chat: mockTextModel("Which step comes first?") });
  expect((await press("hint", 1, "Mass flow")).status).toBe(200);
  useMockModels({ chat: mockTextModel("Use the rule.") });
  await press("hint", 1);
  const model = mockTextModel("Here it is.");
  useMockModels({ chat: model });
  expect((await press("solution", 2)).text).toBe("Here it is.");

  const parts = db.tables.question_parts.toSorted(
    (a, b) => (a.position as number) - (b.position as number),
  );
  expect(parts.map((p) => p.hints)).toEqual([2, 0]);
  expect(parts.map((p) => p.solution_shown_at !== null)).toEqual([false, true]);
  expect(newestQuestion().answered_at).toBeNull();
  expect(newestUserText(model)).toContain("Part 2: Part 2? (solution shown)");
  expect(newestUserText(model)).toContain("Part 1: Part 1? (2 hints given)");
});

test("a press is refused for a part with its solution shown, an answered Question, one that isn't the newest and a missing part", async () => {
  const chatId = await useAskedChat();
  const questionId = newestQuestion().id;
  const usePress = (
    id: unknown,
    kind: "hint" | "solution",
    position: number,
  ) => {
    useMockModels({ chat: mockTextModel("Reply.") });
    return send({ chatId, message: moveMessage(id, kind, position) });
  };

  await usePress(questionId, "solution", 1);
  const refused = [
    await usePress(questionId, "hint", 1),
    await usePress(questionId, "solution", 1),
    await usePress(questionId, "hint", 3),
    await usePress(randomUUID(), "hint", 2),
  ];
  expect(refused.map(({ status }) => status)).toEqual([409, 409, 409, 409]);
  expect(refused[0]!.refusal).toContain("can't be given");

  await useSubmit(chatId, mockTextModel("Thanks."));
  expect((await usePress(questionId, "hint", 2)).status).toBe(409);
  expect(db.tables.question_parts.map((p) => p.hints)).toEqual([0, 0]);
});

test("a choice part stores its options, the picked option and the why; a pick outside the options is refused", async () => {
  seedMap();
  const chatId = randomUUID();
  useMockModels({
    chat: mockToolModel(
      [
        [
          {
            toolName: "ask",
            input: {
              prompt: "Two cases.",
              parts: [
                {
                  prompt: "Which one?",
                  kcId: MAP.thrust,
                  form: "choice",
                  options: ["Mean", "Median"],
                },
              ],
            },
          },
        ],
      ],
      "",
    ),
  });
  await send({
    chatId,
    courseId: COURSE,
    message: userMessage("Quiz me"),
  });
  expect(toolError("ask")).toBeUndefined();
  expect(db.tables.question_parts[0]).toMatchObject({
    form: "choice",
    options: ["Mean", "Median"],
  });

  const refused = await send({
    chatId,
    message: submitMessage(newestQuestion().id, ["Because."], [2]),
  });
  expect(refused.status).toBe(409);
  expect(newestQuestion().answered_at).toBeNull();

  useMockModels({ chat: mockTextModel("Thanks.") });
  await send({
    chatId,
    message: submitMessage(newestQuestion().id, ["Outliers."], [1]),
  });
  expect(db.tables.question_parts[0]).toMatchObject({
    choice: 1,
    answer_text: "Outliers.",
  });
});

test("a reply that failed after the grade was stored: the next message is told the grade is recorded", async () => {
  const chatId = await useAskedChat();
  const first = grading(["full", "full"], "");
  // The step after the grade call fails, as a 429 does.
  let calls = 0;
  const failing = new MockLanguageModelV4({
    doStream: async (options) => {
      if (calls++ === 0) return first.doStream(options);
      throw new APICallError({
        message: "Too many requests",
        url: "https://example.test",
        requestBodyValues: {},
        statusCode: 429,
        isRetryable: false,
      });
    },
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  await useSubmit(chatId, failing);
  expect(newestQuestion().graded_at).not.toBeNull();
  const stored = db.tables.attempts.length;

  const second = grading(["full", "full"], "You got both right.");
  await useReply(chatId, second, "Did I get it?");

  expect(toolError("grade")).toContain("recorded");
  expect(db.tables.attempts).toHaveLength(stored);
  expect(second.doStreamCalls).toHaveLength(2);
});

test("closeQuestion closes the Question without Attempts", async () => {
  const chatId = await useAskedChat();

  await useReply(
    chatId,
    mockToolModel(
      [[{ toolName: "closeQuestion", input: {} }]],
      "Let's look at something else.",
    ),
    "Can we do eigenvalues instead?",
  );

  expect(newestQuestion().graded_at).not.toBeNull();
  expect(db.tables.attempts).toEqual([]);
});

test("grade without results is refused before it runs", async () => {
  const chatId = await useAskedChat();

  await useSubmit(
    chatId,
    mockToolModel(
      [[{ toolName: "grade", input: { help: "none", finalValues: [] } }]],
      "",
    ),
  );

  expect(toolError("grade")).toContain("Invalid input for tool grade");
  expect(toolError("grade")).toContain('"results"');
  expect(newestQuestion().graded_at).toBeNull();
});

test("a reply that spent its steps on tool calls ends with text, on auto for Muse", async () => {
  const chatId = await useAskedChat();
  const failing = { toolName: "grade", input: { help: "none" } };
  const model = mockToolModel(
    [[failing], [failing], [failing], [failing]],
    "Both parts are right.",
  );

  await useSubmit(chatId, model);

  expect(model.doStreamCalls.map(({ toolChoice }) => toolChoice?.type)).toEqual(
    ["auto", "auto", "auto", "auto", "auto"],
  );
  expect(JSON.stringify(db.tables.chat_messages.at(-1)!.parts)).toContain(
    "Both parts are right.",
  );
});

test("grade records no Attempt for a KC retired since the ask", async () => {
  const chatId = await useAskedChat();
  db.tables.kcs.find(({ id }) => id === MAP.efficiency)!.retired_at =
    new Date().toISOString();

  await useSubmit(chatId, grading(["full", "wrong"], "Good."));

  expect(db.tables.attempts).toEqual([
    expect.objectContaining({ kc_id: MAP.thrust, result: "full" }),
  ]);
  expect(storedParts().map(({ result }) => result)).toEqual(["full", "wrong"]);
});

test("the context holds the open Question with its parts, today's checks and the opened Reading sections", async () => {
  seedMap();
  const chatId = randomUUID();
  useMockModels({
    chat: mockToolModel(
      [
        [
          {
            toolName: "showReading",
            input: { sectionId: MAP.section, purpose: "What makes thrust?" },
          },
        ],
      ],
      "",
    ),
  });
  await send({ chatId, courseId: COURSE, message: userMessage("Read") });
  await useReply(chatId, asking([MAP.thrust]), "Done reading.");
  const model = mockTextModel("Close.");
  await useSubmit(chatId, model, ["Mass flow."]);

  const context = newestUserText(model);
  expect(context).toContain(
    `Open Question, answered, to grade, on Thrust equation (KC id ${MAP.thrust}):\\n> A jet engine.\\nPart 1: Part 1?`,
  );
  expect(context).toContain(
    `Reading sections opened: Lecture 7, pp. 3–5 (section id ${MAP.section}).`,
  );
  expect(context).toContain("No KC checked today.");
});

test("a new Chat from a graded Mock exam goes through its tasks, most points lost first", async () => {
  const mockId = randomUUID();
  db.tables.mock_exams.push({
    id: mockId,
    owner: STUDENT,
    course_id: COURSE,
    status: "graded",
  });
  const item = (position: number, prompt: string, awarded: number) => ({
    id: randomUUID(),
    mock_id: mockId,
    owner: STUDENT,
    position,
    prompt,
    points: 6,
    points_awarded: awarded,
    steps: [{ points: awarded, reason: `${prompt} reason` }],
    graded_at: new Date().toISOString(),
    check: null,
    exercise_id: null,
    problem_id: null,
    question_id: null,
  });
  db.tables.mock_items.push(
    item(0, "Name the stages.", 5),
    item(1, "Derive thrust.", 1),
  );
  const model = mockTextModel("Let's start with thrust.");
  useMockModels({ chat: model });
  const chatId = randomUUID();

  await send({
    chatId,
    courseId: COURSE,
    mockId,
    message: userMessage("Let's go through my mock exam."),
  });

  expect(
    db.tables.study_sessions.find((s) => s.chat_id === chatId)!.mock_id,
  ).toBe(mockId);
  const context = newestUserText(model);
  expect(context).toContain("## The Mock exam this session goes through");
  expect(context.indexOf("Derive thrust.")).toBeLessThan(
    context.indexOf("Name the stages."),
  );
  expect(context).toContain("1. 1 of 6 points");
});

test("a new Chat's chosen length is stored and told to the AI; any other length is refused", async () => {
  const model = mockTextModel("Welcome.");
  useMockModels({ chat: model });
  const chatId = randomUUID();

  await send({
    chatId,
    courseId: COURSE,
    minutes: 15,
    message: userMessage("Let's start."),
  });

  expect(
    db.tables.study_sessions.find((s) => s.chat_id === chatId)!.planned_minutes,
  ).toBe(15);
  expect(newestUserText(model)).toContain("The Student chose 15 minutes:");

  const refused = await send({
    chatId: randomUUID(),
    courseId: COURSE,
    minutes: 20,
    message: userMessage("Let's start."),
  });
  expect(refused.status).toBe(400);
});

test("a mock that is not the Student's graded one is ignored", async () => {
  useMockModels({ chat: mockTextModel("Hello.") });
  const chatId = randomUUID();

  const sent = await send({
    chatId,
    courseId: COURSE,
    mockId: randomUUID(),
    message: userMessage("Hi"),
  });

  expect(sent.status).toBe(200);
  expect(
    db.tables.study_sessions.find((s) => s.chat_id === chatId)!.mock_id,
  ).toBeNull();
});
