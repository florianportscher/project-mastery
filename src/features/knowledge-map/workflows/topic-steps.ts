import "server-only";
import { createHash } from "node:crypto";
import {
  topicTreeMessages,
  topicTreeDigest,
  topicTreeSchema,
  topicTreeSettings,
  type OfferedCourse,
} from "@/features/knowledge-map/ai/topic-tree";
import {
  storedAsProposed,
  type ProposedTopic,
  type StoredTreeTopic,
} from "@/features/knowledge-map/domain/topic-tree";
import {
  loadCourseLanguageName,
  touchBuild,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  buildCall,
  RateLimited,
} from "@/features/knowledge-map/workflows/build-call";
import {
  kcsInCourseOrder,
  loadMapInput,
} from "@/features/knowledge-map/workflows/map-input";
import { loadTopicTree } from "@/features/knowledge-map/server/stored-topics";
import {
  dailyLimitReason,
  RATE_LIMITED_STEP_RETRIES,
} from "@/features/usage/server";
import { retryTimeoutMs } from "@/lib/ai/call-timeout";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";

/**
 * The Topic tree step of a build (#351): one `topic` call per build that
 * groups the Course's live KCs into Topics at most two levels deep, made
 * only when what the tree is built from changed since the stored tree.
 */

export type TreeProposal = {
  /** The hash of what the tree is built from; null when no call answered. */
  hash: string | null;
  /** The call's Topics; null to keep the stored tree. */
  topics: ProposedTopic[] | null;
};

export type TreeOutcome =
  { ok: true; tree: TreeProposal | null } | { ok: false; reason: string };

/**
 * What the tree call gets, with short ids for the KCs (`k1…`) and the
 * stored Topics (`t1…`), and the hash of the KCs' ids and names, the
 * language and the tree prompt's digest, which leaves out the stored tree
 * so a build after a call makes none.
 */
function offeredCourse(
  kcs: ReturnType<typeof kcsInCourseOrder>,
  stored: StoredTreeTopic[],
  language: string,
) {
  const kcIds = new Map(kcs.map((kc, index) => [kc.id, `k${index + 1}`]));
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        prompt: topicTreeDigest(),
        language,
        kcs: kcs.map((kc) => [kc.id, kc.name]),
      }),
    )
    .digest("hex");
  const topicIds = new Map(
    stored.map((topic, index) => [topic.id, `t${index + 1}`]),
  );
  const levels = storedAsProposed(stored);
  const course: OfferedCourse = {
    language,
    kcs: kcs.map((kc) => ({
      id: kcIds.get(kc.id)!,
      name: kc.name,
      material: kc.material,
      heading: kc.heading,
    })),
    storedTopics: stored.map((topic, index) => ({
      id: topicIds.get(topic.id)!,
      name: topic.name,
      level: levels[index]!.level,
      kcs: topic.kcs.flatMap((id) => kcIds.get(id) ?? []),
    })),
  };
  return { course, hash, kcIds, topicIds };
}

/**
 * Proposes the Topic tree: no call when the Course has no KCs, or when its
 * KCs and language are what the stored tree was built from; else one call,
 * its short ids turned back into stored ones (unknown ones are dropped). A
 * call that fails is made once more; when that fails too, the stored tree
 * stays (`planTopicTree` places the KCs it lacks) and the build goes on. A
 * reached Daily limit stops the build; the rate limit retries the step
 * after its wait.
 */
export async function proposeTopicTree(courseId: string): Promise<TreeOutcome> {
  "use step";
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId, { stage: "topics" });
  if (!owner) return { ok: true, tree: null };

  const [input, stored, build, language] = await Promise.all([
    loadMapInput(supabase, courseId),
    loadTopicTree(supabase, courseId),
    supabase
      .from("knowledge_map_builds")
      .select("topic_tree_hash")
      .eq("course_id", courseId)
      .single(),
    loadCourseLanguageName(supabase, courseId),
  ]);
  if (build.error) failed("Loading the build", build.error);
  const kcs = kcsInCourseOrder(input);
  const { course, hash, kcIds, topicIds } = offeredCourse(
    kcs,
    stored,
    language,
  );
  if (kcs.length === 0) return { ok: true, tree: { hash, topics: [] } };
  if (hash === build.data.topic_tree_hash) {
    return { ok: true, tree: { hash, topics: null } };
  }

  const treeCall = (timeoutMs?: number) =>
    buildCall(
      supabase,
      {
        studentId: owner,
        task: "topic",
        traceName: "topic-tree",
        metadata: { courseId },
      },
      { ...topicTreeSettings(course), messages: topicTreeMessages(course) },
      topicTreeSchema(),
      timeoutMs,
    );
  let answer = await treeCall();
  const retryMs = retryTimeoutMs(startedAt);
  if (answer === "failed" && retryMs !== null) answer = await treeCall(retryMs);
  // The step's one call: the step is retried after the wait.
  if (answer instanceof RateLimited) throw answer.error;
  if (answer === "limit") return { ok: false, reason: dailyLimitReason };
  // Without a hash, the next Update map calls again.
  if (answer === "failed")
    return { ok: true, tree: { hash: null, topics: null } };
  const kcOf = new Map([...kcIds].map(([id, short]) => [short, id]));
  const topicOf = new Map([...topicIds].map(([id, short]) => [short, id]));
  return {
    ok: true,
    tree: {
      hash,
      topics: answer.topics.map((topic) => ({
        level: topic.level,
        name: topic.name,
        kcIds: topic.kcIds.flatMap((id) => kcOf.get(id) ?? []),
        centralQuestion: topic.centralQuestion,
        continues: topicOf.get(topic.continues) ?? null,
      })),
    },
  };
}

proposeTopicTree.maxRetries = RATE_LIMITED_STEP_RETRIES;
