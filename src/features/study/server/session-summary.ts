import "server-only";
import { getExamFacts } from "@/features/brief/server";
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
  const [exam, attempts] = await Promise.all([
    getExamFacts(supabase, courseId),
    loadCourseAttempts(supabase, courseId),
  ]);
  const recall = replayCourse(attempts, {
    examDate: exam.examDate,
    goal: exam.goal,
    now,
  });
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
  const kcName = await loadKcNames(supabase, [...results.keys()]);
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
 * The names of KCs by id, retired ones included: a rebuild after the
 * session may have taken a KC it checked out of the map.
 */
async function loadKcNames(
  supabase: Supabase,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("kcs")
    .select("id, name")
    .in("id", ids);
  if (error) failed("Loading the session's KCs", error);
  return new Map(data.map(({ id, name }) => [id, name]));
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
