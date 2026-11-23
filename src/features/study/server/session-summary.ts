import "server-only";
import { getExamFacts } from "@/features/brief/server";
import { loadStoredMap } from "@/features/knowledge-map/server";
import { replayCourse } from "@/features/study/domain/replay";
import { sessionEnd } from "@/features/study/domain/session-end";
import { loadCourseAttempts } from "@/features/study/server/attempts";
import { loadChatSession } from "@/features/study/server/sessions";
import type {
  AttemptHelp,
  AttemptResult,
  SessionSummary,
} from "@/features/study/types";
import { failed } from "@/lib/supabase/failed";
import type { Supabase } from "@/lib/supabase/types";

/**
 * What the close card shows of a Chat's Study session now: each KC checked
 * in it with its latest result there and its next review. Null without a
 * session.
 */
export async function loadSessionSummary(
  supabase: Supabase,
  chatId: string,
): Promise<SessionSummary | null> {
  const now = new Date();
  const session = await loadChatSession(supabase, chatId);
  if (!session) return null;
  const { courseId } = session;
  const [exam, attempts, map] = await Promise.all([
    getExamFacts(supabase, courseId),
    loadCourseAttempts(supabase, courseId),
    loadStoredMap(supabase, courseId),
  ]);
  const recall = replayCourse(attempts, {
    examDate: exam.examDate,
    goal: exam.goal,
    now,
  });
  const kcName = new Map(map.kcs.map((kc) => [kc.id, kc.name]));
  // Each KC's latest result in the session, in the order first checked.
  const results = new Map<
    string,
    { result: AttemptResult; help: AttemptHelp }
  >();
  for (const attempt of attempts
    .filter(({ sessionId }) => sessionId === session.id)
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    results.set(attempt.kcId, { result: attempt.result, help: attempt.help });
  }
  return {
    kcs: [...results].map(([id, { result, help }]) => ({
      id,
      name: kcName.get(id) ?? id,
      result,
      help,
      nextReview: recall.get(id)?.nextReview ?? null,
    })),
    ended: sessionEnd(session, now) !== null,
    rating: session.rating,
    ratingNote: session.ratingNote,
  };
}

/**
 * Saves the Student's rating of the Chat's Study session. False when the
 * Chat has no session of theirs.
 */
export async function saveRating(
  supabase: Supabase,
  chatId: string,
  rating: number,
  note: string | null,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("study_sessions")
    .update({ rating, rating_note: note })
    .eq("chat_id", chatId)
    .select("id");
  if (error) failed("Saving the session's rating", error);
  return data.length > 0;
}
