import "server-only";
import { loadCourseLanguage as loadLanguage } from "@/features/ingestion/server";
import {
  buildProgressSchema,
  type BuildProgress,
  type BuildStage,
} from "@/features/knowledge-map/schemas";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { getAiEnv } from "@/lib/ai/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The steps of a Knowledge map update (`build-knowledge-map.ts`) that
 * prepare and end it, and what every step shares. Each runs on the admin
 * client, since no Student is signed in, and so scopes every query to the
 * Course itself. Each starts with `touchBuild`, which sets the build's
 * heartbeat, and does nothing once the build no longer runs.
 */

export const UNITS_PER_STEP = 8;

/**
 * What a step did: how many units it left for the next step, or null when
 * the build no longer runs, and the keys (`unitKey`) of the units whose
 * call failed, left to the next step; with `waitMs` when the Gateway's rate
 * limit turned a call away, so the workflow waits that long before the next
 * step; or why the build stops.
 */
export type StepOutcome =
  | {
      ok: true;
      left: number | null;
      failed?: string[];
      /** Units the rate limit turned away, to call after the others. */
      deferred?: string[];
      waitMs?: number;
    }
  | { ok: false; reason: string };

/**
 * A step of the build that the workflow calls until it leaves nothing,
 * passing the keys of the units whose call failed, once per failure, and
 * of those the rate limit turned away.
 */
export type BuildStep = (
  courseId: string,
  failed: readonly string[],
  deferred: readonly string[],
) => Promise<StepOutcome>;

/**
 * Sets the running build's heartbeat, so `queue_knowledge_map_build` sees
 * it alive, and with `progress` the stage it runs, and returns the Course's
 * owner. Null when no build runs.
 */
export async function touchBuild(
  supabase: AdminSupabase,
  courseId: string,
  progress?: BuildProgress,
): Promise<string | null> {
  return (
    (await touchCountingBuild(supabase, courseId, progress))?.owner ?? null
  );
}

/**
 * `touchBuild` for a step that counts its units, which also returns the
 * build's progress so far, to go on counting (`countedProgress`).
 */
export async function touchCountingBuild(
  supabase: AdminSupabase,
  courseId: string,
  progress?: BuildProgress,
): Promise<{ owner: string; progress: BuildProgress | null } | null> {
  const { data, error } = await supabase
    .from("knowledge_map_builds")
    .update({ heartbeat_at: new Date().toISOString(), progress })
    .eq("course_id", courseId)
    .eq("status", "building")
    .select("owner, progress")
    .maybeSingle();
  if (error) failed("Recording the build's heartbeat", error);
  if (!data) return null;
  const parsed = buildProgressSchema.safeParse(data.progress);
  return { owner: data.owner, progress: parsed.success ? parsed.data : null };
}

/**
 * The progress of a counting stage with `pending` units left: on the
 * stage's first run they are its total; on later runs the total stays and
 * the rest are done.
 */
export function countedProgress(
  previous: BuildProgress | null,
  stage: BuildStage,
  pending: number,
): BuildProgress {
  if (previous?.stage === stage && previous.total !== undefined) {
    const { total } = previous;
    return { stage, done: Math.max(0, total - pending), total };
  }
  return { stage, done: 0, total: pending };
}

/**
 * Records the running build's progress; with `waitMs`, that the rate limit
 * pauses it until then. The next record clears the wait.
 */
export async function recordProgress(
  supabase: AdminSupabase,
  courseId: string,
  progress: BuildProgress,
  waitMs?: number,
): Promise<void> {
  const { error } = await supabase
    .from("knowledge_map_builds")
    .update({
      progress:
        waitMs === undefined
          ? progress
          : {
              ...progress,
              waitUntil: new Date(Date.now() + waitMs).toISOString(),
            },
    })
    .eq("course_id", courseId)
    .eq("status", "building");
  if (error) failed("Recording the build's progress", error);
}

/**
 * Runs `call` on each item, at most AI_CONCURRENCY at a time, and starts
 * none once a call returned "stop", nor when one could no longer end in
 * time for a step that started at `stepStartedAt` (`callFits` with
 * BUILD_CALL_TIMEOUT_MS): in practice, one round of calls per step.
 */
export async function runCalls<Item>(
  items: readonly Item[],
  call: (item: Item) => Promise<"stop" | void>,
  stepStartedAt: number,
): Promise<void> {
  const queue = [...items];
  let stopped = false;
  const worker = async () => {
    while (!stopped && callFits(stepStartedAt, BUILD_CALL_TIMEOUT_MS)) {
      const item = queue.shift();
      if (item === undefined) return;
      if ((await call(item)) === "stop") stopped = true;
    }
  };
  await Promise.all(
    Array.from({ length: getAiEnv().AI_CONCURRENCY }, () => worker()),
  );
}

/**
 * The Course language by name: the one the Student asked for in the
 * Brief, else the most common language of its Materials; English when none
 * has one.
 */
export async function loadCourseLanguageName(
  supabase: AdminSupabase,
  courseId: string,
): Promise<string> {
  return (await loadLanguage(supabase, courseId)).name;
}

/**
 * Prepares a build: "nothing" when the Course has no content or exercise
 * chunks, "stopped" when the build no longer runs. Retires the KCs whose
 * sources are all gone.
 */
export async function prepareBuild(
  courseId: string,
): Promise<"ready" | "nothing" | "stopped"> {
  "use step";
  const supabase = createAdminClient();
  if (!(await touchBuild(supabase, courseId))) return "stopped";
  // This build reads the Course as it is now; a change from here on marks
  // the map again.
  const cleared = await supabase
    .from("knowledge_map_builds")
    .update({ needs_update: false })
    .eq("course_id", courseId);
  if (cleared.error) failed("Clearing the map's update mark", cleared.error);
  const chunks = await supabase
    .from("chunks")
    .select("id")
    .eq("course_id", courseId)
    .in("label", ["content", "exercise"])
    .limit(1);
  if (chunks.error) failed("Loading the chunks", chunks.error);
  if (chunks.data.length === 0) return "nothing";
  await retireUnsourcedKcs(supabase, courseId);
  return "ready";
}

export async function retireUnsourcedKcs(
  supabase: AdminSupabase,
  courseId: string,
) {
  const { error } = await supabase.rpc("retire_unsourced_kcs", {
    p_course_id: courseId,
  });
  if (error) failed("Retiring the KCs without sources", error);
}

export async function failBuild(
  courseId: string,
  reason: string,
): Promise<void> {
  "use step";
  const { error } = await createAdminClient()
    .from("knowledge_map_builds")
    .update({ status: "failed", failure_reason: reason })
    .eq("course_id", courseId)
    .eq("status", "building");
  if (error) failed("Recording the failed build", error);
}
