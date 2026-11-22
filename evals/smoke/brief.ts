import { loadKcPriorities } from "@/features/priorities/server";
import { signInAsUser } from "@/lib/supabase/admin";
import type { Supabase } from "@/lib/supabase/types";
import { EXAM_TITLE, seedSmallCourse } from "./brief-course";
import { sendBriefMessage } from "./brief-send";
import { result, type SmokeCheck } from "./smoke-check";

/** What the Student tells the AI, one message per reply. */
const MESSAGES = [
  "Exam is 2026-12-03, closed book, calculator allowed. I want a good grade.",
  "Skip the lab manual. The lecturer said determinants are important.",
  `Yes, ${EXAM_TITLE} at the end of the lecture notes is an old exam, nothing else is.`,
  "Yes, Chapter 2 is not examined, leave it out.",
];

/** Sends one message through the Brief handler and returns the reply's text. */
async function send(
  client: Supabase,
  studentId: string,
  courseId: string,
  text: string,
) {
  const reply = await sendBriefMessage(client, studentId, courseId, text);
  for (const call of reply.calls) {
    console.info(`  ${call.toolName} ${JSON.stringify(call.input)}`);
    if (call.error !== undefined) {
      console.info(`  tool-output-error: ${call.error}`);
    }
  }
  for (const error of reply.errors) console.info(`  error: ${error}`);
  return reply;
}

/**
 * Four scripted messages in a new Course's Brief, through the real handler.
 * Checks plumbing only: every message got a reply without a handler error,
 * the Brief row exists, and every KC reads a Priority. What the AI chose to
 * store is judged by the maintainer, not here.
 */
export const briefSmoke: SmokeCheck = {
  name: "brief",
  usage:
    "pnpm smoke brief (four scripted messages in a seeded Course's Brief; replies, Brief row, Priorities)",
  // One recorded call per reply, with slack for retries.
  maxCalls: 12,
  async run({ supabase, studentId }) {
    const seeded = await seedSmallCourse(supabase, studentId, "Smoke check");
    const { courseId } = seeded;

    // The Brief runs as the Student, with Row Level Security as in the app.
    const client = await signInAsUser(supabase, studentId);
    const replies = [];
    for (const text of MESSAGES) {
      console.info(`Student: ${text}`);
      const reply = await send(client, studentId, courseId, text);
      console.info(`AI: ${reply.text}`);
      replies.push(reply);
    }

    const brief = await supabase
      .from("briefs")
      .select("course_id")
      .eq("course_id", courseId)
      .maybeSingle();
    if (brief.error) throw new Error(brief.error.message);
    const priorities = await loadKcPriorities(client, courseId);
    const kcs = seeded.chapter2Kcs;
    return [
      result(
        "every message got a reply without a handler error",
        replies.every(
          (reply) => reply.text.trim() !== "" && reply.errors.length === 0,
        ),
        `${replies.filter((reply) => reply.text.trim() === "").length} empty, ${replies.flatMap((reply) => reply.errors).join("; ")}`,
      ),
      result("the Course has a Brief", brief.data !== null),
      result(
        "every KC has a Priority",
        kcs.every((id) => typeof priorities[id] === "number"),
        JSON.stringify(kcs.map((id) => priorities[id])),
      ),
    ];
  },
};
