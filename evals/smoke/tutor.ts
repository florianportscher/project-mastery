import { randomUUID } from "node:crypto";
import { respondInChat } from "@/features/chat/server";
import type { GradedKc } from "@/features/study/server";
import { signInAsUser } from "@/lib/supabase/admin";
import type { Supabase } from "@/lib/supabase/types";
import {
  answerText,
  insertRows,
  numericExercise,
  seedGoldCourse,
} from "./gold-course";
import { result, type SmokeCheck } from "./smoke-check";

const GREETING = "Let's start studying.";

/** How long ago the due KCs were taught. */
const TAUGHT_DAYS_AGO = 3;

/** The Student's wish to read first, in a fourth Chat (#179). */
const READING_REQUEST =
  "I'd like to read the course's pages on this before we start.";

/** A request that makes the AI cite pages (#300). */
const CITATION_REQUEST =
  "Where in the script are the central definitions of this course? Give me the pages.";

/** A preference worth keeping in the Memory (#107). */
const PREFERENCE = "I learn best with examples before formulas.";

/** A tool call the AI made, with the KC ids it passed. */
export type ToolCall = {
  toolName: string;
  kcIds: string[];
  input: Record<string, unknown>;
  /** The tool's result, once it returned one. */
  output?: unknown;
  /** The refusal or failure, when the call failed. */
  error?: string;
};

/**
 * Sends `text` in the Chat through the real Chat handler as the Student,
 * and returns the AI's tool calls and text. `log` gets the transcript.
 */
export async function sendMessage(
  client: Supabase,
  studentId: string,
  chat: { chatId: string; courseId: string },
  text: string,
  log: (line: string) => void = console.info,
  /** A Submit's answer, sent as the message's metadata. */
  answer?: { questionId: string; parts: unknown[] },
): Promise<{
  calls: ToolCall[];
  text: string;
  questionIds: string[];
  graded: GradedKc[];
  /** The KC ids the tools' results named, such as an Exercise's KCs. */
  returned: string[];
  /** The `showReading` calls' inputs. */
  readings: Array<{ sectionId: string; purpose: string }>;
}> {
  log(`Student: ${text}`);
  const response = await respondInChat({
    request: new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        ...chat,
        message: {
          id: randomUUID(),
          role: "user",
          parts: [{ type: "text", text }],
          ...(answer ? { metadata: { answer } } : {}),
        },
      }),
    }),
    supabase: client,
    userId: studentId,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${body}`);
  const chunks = body
    .split("\n")
    .filter((line) => line.startsWith("data: {"))
    .map((line) => JSON.parse(line.slice("data: ".length)));

  const calls: ToolCall[] = [];
  const questionIds: string[] = [];
  const graded: GradedKc[] = [];
  const returned: string[] = [];
  const readings: Array<{ sectionId: string; purpose: string }> = [];
  const toolNames = new Map<string, string>();
  const callsById = new Map<string, ToolCall>();
  for (const part of chunks) {
    if (part.type === "tool-input-available") {
      toolNames.set(part.toolCallId, part.toolName);
    }
    if (
      part.type === "tool-output-available" &&
      toolNames.get(part.toolCallId) === "grade" &&
      Array.isArray(part.output?.kcs)
    ) {
      graded.push(...part.output.kcs);
      log(`  graded ${JSON.stringify(part.output.kcs)}`);
    }
    if (
      part.type === "tool-output-available" &&
      toolNames.get(part.toolCallId) === "getTopic" &&
      Array.isArray(part.output?.kcs)
    ) {
      // A call without kcIds read every KC of the Topic.
      const call = callsById.get(part.toolCallId);
      const read = part.output.kcs.map((kc: { id: string }) => kc.id);
      if (call && call.kcIds.length === 0) call.kcIds = read;
      returned.push(
        ...(part.output.anchors ?? []).map((kc: { id: string }) => kc.id),
      );
    }
    if (
      part.type === "tool-output-available" &&
      typeof part.output?.questionId === "string"
    ) {
      questionIds.push(part.output.questionId);
    }
    if (
      part.type === "tool-output-available" &&
      Array.isArray(part.output?.problems)
    ) {
      const names = part.output.problems.map(
        (exercise: { name?: string }) => exercise.name,
      );
      for (const exercise of part.output.problems) {
        returned.push(
          ...(exercise.kcs ?? []).map((kc: { id: string }) => kc.id),
        );
      }
      log(`  found ${JSON.stringify(names)} ${part.output.note ?? ""}`);
    }
    const answered = callsById.get(part.toolCallId);
    if (answered && part.type === "tool-output-available") {
      answered.output = part.output;
    }
    if (answered && part.type === "tool-output-error") {
      answered.error = String(part.errorText);
    }
    if (part.type === "tool-input-available") {
      log(`  ${part.toolName} ${JSON.stringify(part.input)}`);
      const kcIds =
        part.input?.kcIds ??
        part.input?.results?.map((kc: { kcId: string }) => kc.kcId) ??
        [];
      const call = {
        toolName: part.toolName,
        kcIds,
        input: part.input ?? {},
      };
      calls.push(call);
      callsById.set(part.toolCallId, call);
      if (part.toolName === "showReading") {
        readings.push({
          sectionId: String(part.input?.sectionId ?? ""),
          purpose: String(part.input?.purpose ?? ""),
        });
      }
    }
    if (part.type === "tool-output-error" || part.type === "error") {
      log(`  ${part.type}: ${part.errorText}`);
    }
  }
  // Each step's text is its own part in the Chat: keep them apart.
  const reply = chunks
    .map((part) =>
      part.type === "text-delta"
        ? part.delta
        : part.type === "text-start"
          ? "\n\n"
          : "",
    )
    .join("")
    .trim();
  log(`AI: ${reply}`);
  return { calls, text: reply, questionIds, graded, returned, readings };
}

/**
 * Answers the Chat's open Question as the card's Submit does: `text` in
 * the first part, the other parts left empty, and the first option for a
 * choice part. A Question without parts, or none open, gets `text` as a
 * plain message.
 */
async function answerOpenQuestion(
  client: Supabase,
  studentId: string,
  chat: { chatId: string; courseId: string },
  text: string,
): ReturnType<typeof sendMessage> {
  const { data: session } = await client
    .from("study_sessions")
    .select("id")
    .eq("chat_id", chat.chatId)
    .maybeSingle();
  const { data: question } = session
    ? await client
        .from("questions")
        .select("id, answered_at, graded_at, question_parts(position, form)")
        .eq("session_id", session.id)
        .order("asked_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const open =
    question &&
    !question.answered_at &&
    !question.graded_at &&
    question.question_parts.length > 0;
  if (!open) return sendMessage(client, studentId, chat, text);
  const parts = question.question_parts
    .toSorted((a, b) => a.position - b.position)
    .map(({ position, form }) => ({
      position,
      text: position === 1 ? text : "",
      choice: form === "choice" ? 0 : null,
    }));
  const rendered = parts
    .map((part) => `Part ${part.position}: ${part.text}`)
    .join("\n\n");
  return sendMessage(client, studentId, chat, rendered, console.info, {
    questionId: question.id,
    parts,
  });
}

/**
 * Seeds the gold course (`seedGoldCourse`) and teaches two KCs a few days
 * ago, so both are due. Then sends a greeting, an answer, a preference, a
 * request for a numeric Exercise and its key, a wish to read and a request
 * for pages in Chats through the real Chat handler. Checks plumbing only:
 * every message got a reply (text or tool call) and none failed. Which tools
 * the AI called and what it said is judged by the maintainer, not here.
 */
export const tutorSmoke: SmokeCheck = {
  name: "tutor",
  usage:
    "pnpm smoke tutor (the gold course; a greeting on the next Topic, then two due KCs, a greeting, an answer, a preference, a request for a numeric Exercise and its answer, a wish to read and a request for pages)",
  // The spec's budget. The check counts `ai_usage` rows, and a reply's steps
  // are recorded as one row (task `chat`), with a title per Chat the only
  // others.
  maxCalls: 18,
  async run({ supabase, studentId }) {
    const gold = await seedGoldCourse(supabase, studentId);
    const course = { id: gold.courseId };
    const owned = { owner: studentId, course_id: gold.courseId };

    // The Chat runs as the Student, with Row Level Security as in the app.
    const client = await signInAsUser(supabase, studentId);
    const nextKcs = new Set(gold.topics[0]?.kcs);
    if (nextKcs.size === 0) throw new Error("The gold course has no Topic.");
    const opening = await sendMessage(
      client,
      studentId,
      { chatId: randomUUID(), courseId: course.id },
      GREETING,
    );

    // Two KCs without Prerequisites, taught a few days ago by a question
    // graded full in an earlier session. Only the admin client can backdate
    // an attempt.
    const hasPrerequisite = new Set(gold.prerequisites.map((link) => link.to));
    const taughtKcs = gold.kcs
      .filter((kc) => !hasPrerequisite.has(kc.id))
      .slice(0, 2);
    const taught = taughtKcs.map((kc) => kc.id);
    const answer = taughtKcs.map((kc) => kc.description).join(" ");
    const taughtAt = new Date(
      Date.now() - TAUGHT_DAYS_AGO * 24 * 60 * 60 * 1000,
    ).toISOString();
    const session = { id: randomUUID(), owner: studentId };
    await insertRows(supabase, "study_sessions", [
      {
        ...owned,
        ...session,
        started_at: taughtAt,
        ended_at: taughtAt,
      },
    ]);
    const question = { id: randomUUID(), owner: studentId };
    await insertRows(supabase, "questions", [
      {
        ...question,
        session_id: session.id,
        prompt: `Explain ${taughtKcs.map((kc) => kc.name).join(" and ")}.`,
        asked_at: taughtAt,
        answer_text: answer,
        answered_at: taughtAt,
        graded_at: taughtAt,
      },
    ]);
    await insertRows(
      supabase,
      "question_kcs",
      taught.map((kcId) => ({ question_id: question.id, kc_id: kcId })),
    );
    await insertRows(
      supabase,
      "attempts",
      taught.map((kcId) => ({
        owner: studentId,
        question_id: question.id,
        session_id: session.id,
        kc_id: kcId,
        result: "full",
        help: "none",
        created_at: taughtAt,
      })),
    );

    const chat = { chatId: randomUUID(), courseId: course.id };
    const first = await sendMessage(client, studentId, chat, GREETING);
    const second = await answerOpenQuestion(client, studentId, chat, answer);
    const third = await sendMessage(client, studentId, chat, PREFERENCE);
    // In another Chat the Student asks for an Exercise with a numeric key on
    // the KCs studied so far, and answers it.
    const exerciseChat = { chatId: randomUUID(), courseId: course.id };
    const target = numericExercise(gold, [...taught, ...nextKcs]);
    const fourth = await sendMessage(
      client,
      studentId,
      exerciseChat,
      `Can you give me the exercise from ${target.label}? It starts: "${target.markdown.slice(0, 120)}". I want to practise it.`,
    );
    const fifth = await answerOpenQuestion(
      client,
      studentId,
      exerciseChat,
      `My result: ${answerText(target.finalAnswers)}.`,
    );
    const sixth = await sendMessage(
      client,
      studentId,
      { chatId: randomUUID(), courseId: course.id },
      READING_REQUEST,
    );
    const seventh = await sendMessage(
      client,
      studentId,
      { chatId: randomUUID(), courseId: course.id },
      CITATION_REQUEST,
    );

    const replies = [
      opening,
      first,
      second,
      third,
      fourth,
      fifth,
      sixth,
      seventh,
    ];
    const silent = replies.filter(
      (reply) => reply.text === "" && reply.calls.length === 0,
    );
    // A graded Question with parts has a result on every part, and a part
    // of a Question that was submitted keeps its answer row.
    const { data: parts, error } = await supabase
      .from("question_parts")
      .select("result, questions!inner(graded_at)")
      .eq("owner", studentId);
    if (error) throw new Error(error.message);
    const ungraded = parts.filter(
      (part) => part.questions.graded_at !== null && part.result === null,
    );
    return [
      result(
        "every message got a reply",
        silent.length === 0,
        `${silent.length} of ${replies.length} silent`,
      ),
      result(
        "graded parts have a result",
        ungraded.length === 0,
        `${parts.length} parts stored, ${ungraded.length} graded without a result`,
      ),
    ];
  },
};
