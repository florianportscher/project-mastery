import "server-only";
import {
  prerequisiteCheckMessages,
  prerequisiteCheckSchema,
  prerequisiteCheckSettings,
  type OfferedKc,
  type OfferedName,
} from "@/features/knowledge-map/ai/prerequisite-check";
import { dailyLimitReason } from "@/features/knowledge-map/domain/build-failure";
import { acyclicLinks } from "@/features/knowledge-map/domain/prerequisite-cycles";
import { kcAssumesSchema } from "@/features/knowledge-map/schemas";
import {
  runCalls,
  touchBuild,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  buildCall,
  RateLimited,
} from "@/features/knowledge-map/workflows/build-call";
import {
  firstSourcePlaces,
  kcsInCourseOrder,
  loadMapInput,
} from "@/features/knowledge-map/workflows/map-input";
import { RATE_LIMITED_STEP_RETRIES } from "@/features/usage/server";
import { allRows } from "@/lib/supabase/all-rows";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";

/**
 * The Prerequisite check of an update (#315): what KCs of earlier builds
 * assume from outside the Course as text (`kcs.assumes`) is asked once
 * against the KCs this build stored, 50 names per call (task `map`). A name
 * that means such a KC leaves the text, and becomes a Prerequisite when
 * that KC comes earlier in the Course.
 */

/** The most names one check call is asked about. */
const NAMES_PER_CALL = 50;
/** The most names one step asks about. */
const NAMES_PER_STEP = 100;

const nameKey = (name: string) => name.trim().toLowerCase();

/**
 * What a step that asks stored names again did: how many names it left,
 * or null when the build no longer runs, and the key of the last name it
 * handled, which the next step starts after; or why the build stops.
 */
export type RematchOutcome =
  | { ok: true; left: number | null; after: string; waitMs?: number }
  | { ok: false; reason: string };

/**
 * Asks the names that live KCs stored before this build assume as text
 * against the live KCs this build stored, up to NAMES_PER_STEP names after
 * the key `after` (`<kc id>/<name>`, in key order). A name the check
 * matches leaves the KC's text, and becomes a Prerequisite when it means an
 * earlier KC. A name whose call fails stays as it is. Calls that no longer
 * fit the step, or that the rate limit turned away (`waitMs`), are left to
 * the next step. A reached Daily limit stops the build.
 */
export async function recheckAssumes(
  courseId: string,
  after: string,
): Promise<RematchOutcome> {
  "use step";
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId);
  if (!owner) return { ok: true, left: null, after };

  const [build, kcs] = await Promise.all([
    supabase
      .from("knowledge_map_builds")
      .select("started_at")
      .eq("course_id", courseId)
      .single(),
    allRows("Loading the KCs", (from, to) =>
      supabase
        .from("kcs")
        .select("id, assumes, created_at")
        .eq("course_id", courseId)
        .is("retired_at", null)
        .order("id")
        .range(from, to),
    ),
  ]);
  if (build.error) failed("Loading the build", build.error);
  const buildStart = Date.parse(build.data.started_at);
  const isNew = (kc: { created_at: string }) =>
    Date.parse(kc.created_at) >= buildStart;
  const fresh = new Set(kcs.filter(isNew).map((kc) => kc.id));
  const names = kcs
    .filter((kc) => !isNew(kc))
    .flatMap((kc) =>
      kcAssumesSchema.parse(kc.assumes).map((assumed) => ({
        key: `${kc.id}/${nameKey(assumed.name)}`,
        kcId: kc.id,
        ...assumed,
      })),
    )
    .filter((name) => name.key > after)
    .toSorted((a, b) => (a.key < b.key ? -1 : 1));
  if (fresh.size === 0 || names.length === 0) {
    return { ok: true, left: 0, after };
  }

  const map = await loadMapInput(supabase, courseId);
  const places = firstSourcePlaces(map);
  const kcOf = new Map(map.kcs.map((kc) => [kc.id, kc]));
  const candidates = kcsInCourseOrder(map).filter((kc) => fresh.has(kc.id));
  const offeredKcs = candidates.map((kc, index): OfferedKc => ({
    id: `k${index + 1}`,
    chapter: kc.chapter,
    name: kc.name,
    description: kc.description,
  }));
  const storedKcId = new Map(
    candidates.map((kc, index) => [offeredKcs[index]!.id, kc.id]),
  );

  const batch = names.slice(0, NAMES_PER_STEP);
  const calls: Array<typeof batch> = [];
  for (let start = 0; start < batch.length; start += NAMES_PER_CALL) {
    calls.push(batch.slice(start, start + NAMES_PER_CALL));
  }
  const matched: Array<{ kc: string; name: string; from?: string }> = [];
  const asked = new Set<number>();
  let limitReached = false;
  let waitMs: number | undefined;
  await runCalls(
    calls.map((names, index) => ({ names, index })),
    async ({ names, index }) => {
      const offered = names.map((name, n): OfferedName => {
        const user = kcOf.get(name.kcId);
        return {
          id: `n${n + 1}`,
          name: name.name,
          description: name.description,
          usedBy: user ? `${user.name}: ${user.description}` : "",
        };
      });
      const input = { names: offered, kcs: offeredKcs };
      const answer = await buildCall(
        supabase,
        {
          studentId: owner,
          task: "map",
          traceName: "check-prerequisites",
          metadata: { courseId },
        },
        {
          ...prerequisiteCheckSettings(input),
          messages: prerequisiteCheckMessages(input),
        },
        prerequisiteCheckSchema(offered, offeredKcs),
      );
      if (answer === "limit") {
        limitReached = true;
        return "stop";
      }
      if (answer instanceof RateLimited) {
        waitMs = Math.max(waitMs ?? 0, answer.waitMs);
        return "stop";
      }
      asked.add(index);
      if (answer === "failed") return;
      names.forEach((name, n) => {
        const meant = answer.meanings[offered[n]!.id];
        const from = typeof meant === "string" && storedKcId.get(meant);
        if (!from) return;
        // A KC the Course teaches later would be a forward link: none.
        const earlier =
          (places.get(from) ?? Infinity) < (places.get(name.kcId) ?? Infinity);
        matched.push({
          kc: name.kcId,
          name: name.name,
          ...(earlier && { from }),
        });
      });
    },
    startedAt,
  );

  const links = matched.flatMap((m) =>
    m.from ? [{ from: m.from, to: m.kc }] : [],
  );
  const { data, error } = await supabase.rpc("store_assumed_prerequisites", {
    p_course_id: courseId,
    p_prerequisites: acyclicLinks(map.prerequisites, links),
    p_assumes: [],
    p_matched: matched.map(({ kc, name }) => ({ kc, name })),
    p_extraction_ids: [],
  });
  if (error) failed("Storing the names asked again", error);
  if (!data) return { ok: true, left: null, after };
  if (limitReached) return { ok: false, reason: dailyLimitReason };

  // The names up to the first call that never ran are done.
  const firstUnasked = calls.findIndex((_, index) => !asked.has(index));
  const done = firstUnasked < 0 ? batch.length : firstUnasked * NAMES_PER_CALL;
  return {
    ok: true,
    left: names.length - done,
    after: done === 0 ? after : batch[done - 1]!.key,
    waitMs,
  };
}

recheckAssumes.maxRetries = RATE_LIMITED_STEP_RETRIES;
