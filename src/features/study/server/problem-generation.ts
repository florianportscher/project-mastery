import "server-only";
import { start } from "workflow/api";
import { loadStudy } from "@/features/study/server/study-state";
import { generateProblems } from "@/features/study/workflows/generate-problems";
import type { Supabase } from "@/lib/supabase/types";

/**
 * After a Study session ended, starts generating the Course's review stock
 * and the stock of the Ranking's next Topic, in one run. A Course whose
 * ranking cannot be read gets the review stock alone.
 */
export async function queueSessionEndGeneration(
  supabase: Supabase,
  courseId: string,
): Promise<void> {
  let topicId: string | null = null;
  try {
    const { ranked } = await loadStudy(supabase, courseId, new Date());
    const next = ranked.find((item) => item.kind === "topic");
    topicId = next?.topicId ?? null;
  } catch (error) {
    console.error("Reading the next Topic failed:", error);
  }
  await queueProblemGeneration(supabase, courseId, topicId);
}

/**
 * Starts generating Problems for the signed-in Student's Course (#183):
 * the review stock, and the stock of `topicId` as well when it is given. A run already
 * running drops the call (`queue_problem_run`). It never throws, so a
 * trigger cannot fail the Student's reply or action: errors are logged, and
 * a run whose workflow cannot start is released.
 */
export async function queueProblemGeneration(
  supabase: Supabase,
  courseId: string,
  topicId: string | null,
): Promise<void> {
  try {
    const { data: queued, error } = await supabase.rpc("queue_problem_run", {
      p_course_id: courseId,
      ...(topicId !== null && { p_topic_id: topicId }),
    });
    if (error) throw new Error(error.message);
    if (!queued) return;
    try {
      await start(generateProblems, [courseId]);
    } catch (startError) {
      console.error("Starting the generate run failed:", startError);
      await supabase.rpc("release_problem_run", { p_course_id: courseId });
    }
  } catch (error) {
    console.error("Queueing the generate run failed:", error);
  }
}
