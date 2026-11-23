// @vitest-environment node
import { expect, test, vi } from "vitest";
import { fakeSupabase } from "@/lib/supabase/testing";
import type { Supabase } from "@/lib/supabase/types";

vi.mock("server-only", () => ({}));

const COURSE = "aaaaaaaa-c000-4000-8000-000000000001";
const CHAT = "aaaaaaaa-c400-4000-8000-000000000001";
const SESSION = "aaaaaaaa-5000-4000-8000-000000000001";
const QUESTION = "aaaaaaaa-9000-4000-8000-000000000001";
const [THRUST, NOZZLE] = [1, 2].map(
  (n) => `aaaaaaaa-0000-4000-8000-00000000000${n}`,
) as [string, string];

// The map holds Thrust only: a rebuild retired Nozzle after the session,
// keeping its Attempts.
vi.mock("@/features/knowledge-map/server", () => ({
  loadStoredMap: async () => ({
    kcs: [{ id: THRUST, name: "Thrust equation" }],
    prerequisites: [],
    exercises: [],
  }),
}));

const { loadSessionSummary } = await import("./session-summary");

test("names a KC the session checked that a rebuild retired since", async () => {
  const attempt = (kcId: string) => ({
    question_id: QUESTION,
    session_id: SESSION,
    kc_id: kcId,
    result: "full",
    help: "none",
    created_at: new Date().toISOString(),
  });
  const db = fakeSupabase({
    tables: {
      study_sessions: [
        { id: SESSION, course_id: COURSE, chat_id: CHAT, ended_at: null },
      ],
      chats: [{ id: CHAT, last_message_at: new Date().toISOString() }],
      questions: [{ id: QUESTION, session_id: SESSION, exercise_id: null }],
      attempts: [attempt(THRUST), attempt(NOZZLE)],
      kcs: [
        { id: THRUST, course_id: COURSE, name: "Thrust equation" },
        {
          id: NOZZLE,
          course_id: COURSE,
          name: "Nozzle flow",
          retired_at: new Date().toISOString(),
        },
      ],
    },
    foreignKeys: {
      attempts: { question_id: "questions", session_id: "study_sessions" },
    },
  });

  const summary = await loadSessionSummary(db as unknown as Supabase, CHAT);

  expect(summary?.kcs.map(({ name }) => name)).toEqual([
    "Thrust equation",
    "Nozzle flow",
  ]);
});
