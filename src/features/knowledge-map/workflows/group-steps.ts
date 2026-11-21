import "server-only";
import {
  GROUPING_TEXT_CHARS,
  groupingAnswerSchema,
  groupingCallSettings,
  groupingMessages,
  type GroupingItem,
} from "@/features/knowledge-map/ai/exercise-grouping";
import { dailyLimitReason } from "@/features/knowledge-map/domain/build-failure";
import {
  chapterPath,
  checkedGroups,
  groupingHash,
  groupingRuns,
  offeredIds,
  ownGroups,
  type ExerciseGroup,
  type GroupingChunk,
  type PathChapter,
} from "@/features/knowledge-map/domain/exercise-groups";
import {
  buildCall,
  RateLimited,
} from "@/features/knowledge-map/workflows/build-call";
import {
  touchBuild,
  type StepOutcome,
} from "@/features/knowledge-map/workflows/build-steps";
import {
  loadStoredGroups,
  type StoredGroups,
} from "@/features/knowledge-map/workflows/exercise-batches";
import { RATE_LIMITED_STEP_RETRIES } from "@/features/usage/server";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { allRows } from "@/lib/supabase/all-rows";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The grouping step of a build: which exercise and solution chunks form
 * each Exercise. One call (task `ingest`) sees every exercise and solution
 * chunk of the Course in Course order, with its Material, Chapter path and
 * first characters, and answers the Exercises; a Course of more than 400
 * such chunks goes in calls of at most 400. It runs only when the Course's
 * exercise and solution chunks changed since the last grouping
 * (`exercise_grouping_hash`), and stores the Exercises on the build row
 * (`exercise_groups`) for the exercise extraction.
 */

/** An exercise or solution chunk with what the grouping call reads of it. */
type CourseChunk = GroupingChunk & Omit<GroupingItem, "id">;

/**
 * Groups the Course's exercise and solution chunks into Exercises, unless
 * they are unchanged since the last grouping. A call that fails is left to
 * the next step (`failed` names it); when it fails again, each of its
 * exercise chunks becomes an Exercise of its own, without a solution, and
 * the check report says so. A call the rate limit turned away waits
 * (`waitMs`). Nothing is stored until every call is answered or given up.
 */
export async function groupExercises(
  courseId: string,
  failedKeys: readonly string[] = [],
): Promise<StepOutcome> {
  "use step";
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId);
  if (!owner) return { ok: true, left: null };

  const [chunks, stored] = await Promise.all([
    loadGroupingChunks(supabase, courseId),
    loadStoredGroups(supabase, courseId),
  ]);
  const hash = groupingHash(chunks);
  if (stored.groups && stored.hash === hash) return { ok: true, left: 0 };

  const runs = groupingRuns(chunks);
  const exercises: ExerciseGroup[] = [];
  let fallback = false;
  for (const [index, run] of runs.entries()) {
    const key = `grouping/${index}`;
    if (!callFits(startedAt, BUILD_CALL_TIMEOUT_MS)) {
      return { ok: true, left: runs.length - index };
    }
    const answer = await groupRun(supabase, { owner, courseId }, run);
    if (answer === "limit") return { ok: false, reason: dailyLimitReason };
    if (answer instanceof RateLimited) {
      return { ok: true, left: runs.length - index, waitMs: answer.waitMs };
    }
    if (answer === "failed") {
      if (!failedKeys.includes(key)) {
        return { ok: true, left: runs.length - index, failed: [key] };
      }
      exercises.push(...ownGroups(run));
      fallback = true;
      continue;
    }
    exercises.push(...answer);
  }

  const groups: StoredGroups = { exercises, fallback };
  const { error } = await supabase
    .from("knowledge_map_builds")
    .update({
      exercise_groups: groups,
      // A fallback is grouped again by the next build.
      exercise_grouping_hash: fallback ? null : hash,
    })
    .eq("course_id", courseId)
    .eq("status", "building");
  if (error) failed("Storing the Exercise groups", error);
  return { ok: true, left: 0 };
}

groupExercises.maxRetries = RATE_LIMITED_STEP_RETRIES;

/**
 * One grouping call over a run of chunks: its Exercises, checked in code
 * (`checkedGroups`).
 */
async function groupRun(
  supabase: AdminSupabase,
  { owner, courseId }: { owner: string; courseId: string },
  run: CourseChunk[],
): Promise<ExerciseGroup[] | "limit" | "failed" | RateLimited> {
  const offered = offeredIds(run);
  const items = (label: GroupingChunk["label"]): GroupingItem[] =>
    [...offered]
      .filter(([, chunk]) => chunk.label === label)
      .map(([id, chunk]) => ({
        id,
        material: chunk.material,
        chapter: chunk.chapter,
        text: chunk.text,
      }));
  const exercises = items("exercise");
  const solutions = items("solution");
  const answer = await buildCall(
    supabase,
    {
      studentId: owner,
      task: "ingest",
      traceName: "group-exercises",
      metadata: { courseId },
    },
    {
      ...groupingCallSettings(exercises, solutions),
      messages: groupingMessages(exercises, solutions),
    },
    groupingAnswerSchema(),
  );
  if (typeof answer === "string" || answer instanceof RateLimited) {
    return answer;
  }
  return checkedGroups(answer.exercises, offered);
}

/**
 * The Course's exercise and solution chunks in Course order (Materials by
 * position, then chunks by position), each with its Material's name, its
 * Chapter path and its first characters.
 */
async function loadGroupingChunks(
  supabase: AdminSupabase,
  courseId: string,
): Promise<CourseChunk[]> {
  const [materials, chapters, chunks] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position")
      .order("created_at")
      .order("id"),
    allRows("Loading the Chapters", (from, to) =>
      supabase
        .from("chapters")
        .select("id, parent_id, depth, title")
        .eq("course_id", courseId)
        .order("id")
        .range(from, to),
    ),
    allRows("Loading the Course's exercises", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id, position, label, markdown, chapter_id")
        .eq("course_id", courseId)
        .in("label", ["exercise", "solution"])
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  const chapterById = new Map<string, PathChapter>(
    chapters.map((chapter) => [
      chapter.id,
      {
        parentId: chapter.parent_id,
        depth: chapter.depth,
        title: chapter.title,
      },
    ]),
  );
  return materials.data.flatMap((material) =>
    chunks
      .filter((chunk) => chunk.material_id === material.id)
      .map((chunk) => ({
        id: chunk.id,
        label: chunk.label as GroupingChunk["label"],
        material: material.name,
        chapter: chapterPath(chunk.chapter_id, chapterById).join(" > "),
        text: chunk.markdown.slice(0, GROUPING_TEXT_CHARS),
      })),
  );
}
