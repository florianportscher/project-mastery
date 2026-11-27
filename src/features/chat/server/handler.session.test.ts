// @vitest-environment node
// The chat handler and the Chat's Study session: an ended or idle session
// takes no more messages. Shared setup and helpers: handler-testing.ts.
import { randomUUID } from "node:crypto";
import { expect, test, vi } from "vitest";
import { mockTextModel, mockToolModel, useMockModels } from "@/lib/ai/testing";
import {
  COURSE,
  MAP,
  STUDENT,
  db,
  seedChat,
  seedMap,
  send,
  startedWorkflows,
  storedMessages,
  userMessage,
} from "./handler-testing";

vi.mock("server-only", () => ({}));

const HOUR_MS = 60 * 60 * 1000;

/** A stored Chat whose newest message was `ago` ms back, with its session. */
function seedSessionChat(ago: number, endedAt: string | null = null) {
  const chatId = seedChat(STUDENT, [
    { role: "user", parts: [{ type: "text", text: "Earlier" }] },
  ]);
  const newest = new Date(Date.now() - ago).toISOString();
  db.tables.chats.find(({ id }) => id === chatId)!.last_message_at = newest;
  db.tables.study_sessions.push({
    id: randomUUID(),
    owner: STUDENT,
    chat_id: chatId,
    course_id: COURSE,
    ended_at: endedAt,
  });
  return { chatId, newest };
}

test("a message to a session idle for over 2 hours ends it at its newest message and is refused", async () => {
  const model = mockTextModel("Never sent.");
  useMockModels({ chat: model });
  const { chatId, newest } = seedSessionChat(2 * HOUR_MS + 1000);

  for (const text of ["Still there?", "Hello?"]) {
    expect(await send({ chatId, message: userMessage(text) })).toEqual({
      status: 409,
      refusal: expect.stringContaining("study session has ended"),
    });
  }

  expect(model.doStreamCalls).toHaveLength(0);
  expect(storedMessages(chatId).map(({ text }) => text)).toEqual(["Earlier"]);
  expect(db.tables.study_sessions[0]!.ended_at).toBe(newest);
  // Its end queues the review stock once.
  expect(db.tables.problem_runs).toEqual([
    { course_id: COURSE, topic_id: null },
  ]);
});

const sessionOf = (chatId: string) =>
  db.tables.study_sessions.find((row) => row.chat_id === chatId)!;

test("a message with a photo answers the whole open Question; a typed one doesn't", async () => {
  seedMap();
  const chatId = randomUUID();
  const part = {
    prompt: "Why?",
    kcId: MAP.thrust,
    form: "short",
    options: null,
  };
  useMockModels({
    chat: mockToolModel(
      [[{ toolName: "ask", input: { prompt: "A jet.", parts: [part] } }]],
      "",
    ),
  });
  await send({ chatId, courseId: COURSE, message: userMessage("Quiz me") });

  useMockModels({ chat: mockTextModel("Go on.") });
  await send({ chatId, message: userMessage("What is thrust?") });
  expect(db.tables.questions[0]!.answered_at).toBeNull();

  const photo = { id: randomUUID(), name: "Photo", mediaType: "image/png" };
  const storagePath = `${STUDENT}/${COURSE}/${photo.id}`;
  db.files.seed("course-files", storagePath, {
    body: "png",
    contentType: photo.mediaType,
  });
  db.tables.materials.push({
    id: photo.id,
    owner: STUDENT,
    course_id: COURSE,
    name: photo.name,
    media_type: photo.mediaType,
    size_bytes: 3,
    storage_path: storagePath,
  });
  const answer = {
    ...userMessage("My working."),
    parts: [
      { type: "text", text: "My working." },
      {
        type: "data-material",
        data: {
          materialId: photo.id,
          name: photo.name,
          mediaType: "image/png",
        },
      },
    ],
  };
  await send({ chatId, message: answer });

  expect(db.tables.questions[0]).toMatchObject({
    answer_text: "My working.",
    answer_message_id: answer.id,
    answered_at: expect.any(String),
  });
});

test("a session's first reply ends and closes the Course's idle sessions, not a running one", async () => {
  useMockModels({ chat: mockTextModel("What shall we study?") });
  const idle = seedSessionChat(3 * HOUR_MS);
  const running = seedSessionChat(HOUR_MS);

  await send({
    chatId: randomUUID(),
    courseId: COURSE,
    message: userMessage("Hi"),
  });

  expect(sessionOf(idle.chatId).ended_at).toBe(idle.newest);
  expect(sessionOf(running.chatId).ended_at).toBeNull();
  expect(startedWorkflows).toEqual([
    { name: "closeStudySession", args: [sessionOf(idle.chatId).id] },
  ]);
});

test("a message to an ended session is refused, and one within 2 hours is answered", async () => {
  useMockModels({ chat: mockTextModel("Welcome back.") });
  const ended = seedSessionChat(HOUR_MS, new Date().toISOString());
  const running = seedSessionChat(HOUR_MS);

  expect(
    await send({ chatId: ended.chatId, message: userMessage("More?") }),
  ).toMatchObject({ status: 409 });
  expect(
    await send({ chatId: running.chatId, message: userMessage("More?") }),
  ).toMatchObject({ status: 200, text: "Welcome back." });
  expect(db.tables.study_sessions[1]!.ended_at).toBeNull();
});
