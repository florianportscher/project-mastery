import "server-only";
import { loadChunkSources } from "@/features/ingestion/server";
import { uncitedPages } from "@/features/knowledge-map/domain/check-report";
import { SAME_KC_SIMILARITY } from "@/features/knowledge-map/domain/kc-similarity";
import { exerciseLabel } from "@/features/knowledge-map/domain/exercise-label";
import { redundantLinks } from "@/features/knowledge-map/domain/prerequisite-cycles";
import {
  planTopicTree,
  storedAsProposed,
} from "@/features/knowledge-map/domain/topic-tree";
import { teachingOrder } from "@/features/knowledge-map/domain/topics";
import type { CheckReport } from "@/features/knowledge-map/schemas";
import { loadTopicTree } from "@/features/knowledge-map/server/stored-topics";
import type { TreeProposal } from "@/features/knowledge-map/workflows/topic-steps";
import {
  MIN_UNIT_COVERAGE,
  unitCoverage,
} from "@/features/knowledge-map/domain/unit-coverage";
import {
  retireUnsourcedKcs,
  touchBuild,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  isCurrent,
  loadCourseUnits,
  loadStoredGroups,
  loadStoredUnits,
  unitKey,
} from "@/features/knowledge-map/workflows/course-units";
import {
  kcsInCourseOrder,
  loadMapInput,
  type MapInput,
} from "@/features/knowledge-map/workflows/map-input";
import { allRows } from "@/lib/supabase/all-rows";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The last step of a build: the map in Course order with its Topic tree
 * and check report.
 */

const MAX_DUPLICATES = 100;

/**
 * Ends a build: retires the KCs whose sources went meanwhile, puts the KCs
 * in the order of their first sources and the Exercises in Course order,
 * stores the Topic tree `tree` proposes (or the stored one again) with each
 * Topic's KCs in teaching order, drops redundant Prerequisites, stores the
 * check report and marks the build built.
 */
export async function arrangeKnowledgeMap(
  courseId: string,
  tree: TreeProposal,
): Promise<void> {
  "use step";
  const supabase = createAdminClient();
  if (!(await touchBuild(supabase, courseId, { stage: "finishing" }))) return;
  await retireUnsourcedKcs(supabase, courseId);

  const [input, stored] = await Promise.all([
    loadMapInput(supabase, courseId),
    loadTopicTree(supabase, courseId),
  ]);
  const ordered = kcsInCourseOrder(input);
  const kcs = ordered.map((kc) => kc.id);
  const topics = planTopicTree({
    proposed: tree.topics ?? storedAsProposed(stored),
    kcs: ordered,
    stored,
  }).map((topic) => ({
    ...topic,
    kcs: teachingOrder(topic.kcs, input.prerequisites),
  }));
  const { error } = await supabase.rpc("arrange_knowledge_map", {
    p_course_id: courseId,
    p_kcs: kcs,
    p_topics: topics,
    // Generated types make every argument non-null; the column takes null.
    p_topic_tree_hash: tree.hash as string,
    p_dropped_prerequisites: redundantLinks(input.prerequisites),
    p_check_report: await checkReport(supabase, courseId, input),
  });
  if (error) failed("Arranging the knowledge map", error);
}

/**
 * What the build checks: pages with teaching content that no live KC
 * cites, Exercises without KCs, the KC pairs still alike after merging,
 * the teaching units whose KCs cite less than MIN_UNIT_COVERAGE of them,
 * the pages read without units and the units the build gave up on.
 */
async function checkReport(
  supabase: AdminSupabase,
  courseId: string,
  input: MapInput,
): Promise<CheckReport> {
  const [exercises, alike, units, exerciseUnits, stored, unreadPages, groups] =
    await Promise.all([
      exercisesWithoutKcs(supabase, courseId),
      supabase.rpc("alike_kcs", {
        p_course_id: courseId,
        p_similarity: SAME_KC_SIMILARITY,
        p_count: MAX_DUPLICATES,
      }),
      loadCourseUnits(supabase, courseId, "content"),
      loadCourseUnits(supabase, courseId, "exercise"),
      loadStoredUnits(supabase, courseId),
      loadUnreadPages(supabase, courseId),
      loadStoredGroups(supabase, courseId),
    ]);
  if (alike.error) failed("Finding alike KCs", alike.error);
  // A unit without an extraction of its content was given up on.
  const storedOf = new Map(stored.map((row) => [row.key, row]));
  const unitsNotExtracted = [
    ...new Set(
      [...units, ...exerciseUnits]
        .filter((unit) => !isCurrent(storedOf.get(unitKey(unit)), unit))
        .map((unit) => unit.title),
    ),
  ];
  const citedChunks = input.kcs.flatMap((kc) => kc.sources);
  const unitsBelowCoverage = units.flatMap((unit) => {
    const coverage = unitCoverage(unit.chunks, citedChunks);
    return coverage < MIN_UNIT_COVERAGE ? [{ unit: unit.title, coverage }] : [];
  });

  const name = new Map(input.kcs.map((kc) => [kc.id, kc.name]));
  return {
    uncitedPages: uncitedPages(
      input.materials,
      input.chunks,
      new Set(citedChunks),
    ),
    exercisesWithoutKcs: exercises,
    duplicates: alike.data.flatMap(({ a, b, similarity }) =>
      name.has(a) && name.has(b)
        ? [{ a: name.get(a)!, b: name.get(b)!, similarity }]
        : [],
    ),
    unitsBelowCoverage,
    unreadPages,
    unitsNotExtracted,
    exercisesNotGrouped: groups.groups?.fallback ?? false,
  };
}

/**
 * The pages of the Course's Materials that were read without units,
 * `unreadable` or `uncovered`, per Material in Course order.
 */
async function loadUnreadPages(
  supabase: AdminSupabase,
  courseId: string,
): Promise<CheckReport["unreadPages"]> {
  const materials = await supabase
    .from("materials")
    .select("id, name")
    .eq("course_id", courseId)
    .order("position");
  if (materials.error) failed("Loading the Materials", materials.error);
  const pages = await allRows("Loading the unread pages", (from, to) =>
    supabase
      .from("material_pages")
      .select("material_id, page_number")
      .in(
        "material_id",
        materials.data.map((material) => material.id),
      )
      .in("skipped", ["unreadable", "uncovered"])
      .order("material_id")
      .order("page_number")
      .range(from, to),
  );
  return materials.data.flatMap((material) => {
    const unread = pages
      .filter((page) => page.material_id === material.id)
      .map((page) => page.page_number);
    return unread.length > 0
      ? [{ material: material.name, pages: unread }]
      : [];
  });
}

async function exercisesWithoutKcs(
  supabase: AdminSupabase,
  courseId: string,
): Promise<string[]> {
  const [exercises, tested] = await Promise.all([
    allRows("Loading the Exercises", (from, to) =>
      supabase
        .from("exercises")
        .select("id, question_chunk_id")
        .eq("course_id", courseId)
        .order("position")
        .range(from, to),
    ),
    allRows("Loading the exercise KCs", (from, to) =>
      supabase
        .from("exercise_kcs")
        .select("exercise_id")
        .eq("course_id", courseId)
        .order("exercise_id")
        .range(from, to),
    ),
  ]);
  const testing = new Set(tested.map((row) => row.exercise_id));
  const untested = exercises.filter((exercise) => !testing.has(exercise.id));
  if (untested.length === 0) return [];
  const chunks = await loadChunkSources(
    supabase,
    untested.map((exercise) => exercise.question_chunk_id),
  );
  const chunkOf = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  return untested.map((exercise) => {
    const chunk = chunkOf.get(exercise.question_chunk_id);
    return chunk ? exerciseLabel(chunk) : "Exercise";
  });
}
