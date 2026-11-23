import "server-only";
import {
  GROUPING_TEXT_CHARS,
  groupingAnswerSchema,
  groupingCallSettings,
  groupingDigest,
  groupingMessages,
  type GroupingExam,
  type GroupingItem,
} from "@/features/knowledge-map/ai/exercise-grouping";
import {
  checkedExams,
  checkedGroups,
  courseExams,
  type CheckedGroup,
  type FoundExam,
  groupingHash,
  groupingRuns,
  offeredIds,
  ownGroups,
  type ExerciseGroup,
  type GroupingChunk,
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
import {
  dailyLimitReason,
  RATE_LIMITED_STEP_RETRIES,
} from "@/features/usage/server";
import { BUILD_CALL_TIMEOUT_MS, callFits } from "@/lib/ai/call-timeout";
import { allRows } from "@/lib/supabase/all-rows";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * The grouping step of a build: which exercise and solution chunks form
 * each Exercise. One call (task `ingest`) sees every exercise and solution
 * chunk of the Course in Course order, with its Material, heading and
 * first characters, and answers the Exercises; a Course of more than 400
 * such chunks goes in calls of at most 400. It runs only when the Course's
 * exercise and solution chunks or the grouping prompt changed since the
 * last grouping
 * (`exercise_grouping_hash`), and stores the Exercises on the build row
 * (`exercise_groups`) for the exercise extraction.
 */

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
  const hash = groupingHash(chunks, groupingDigest());
  if (stored.groups && stored.hash === hash) return { ok: true, left: 0 };

  const runs = groupingRuns(chunks);
  const storedExams = await loadExams(supabase, courseId);
  const answered: RunAnswer[] = [];
  let fallback = false;
  for (const [index, run] of runs.entries()) {
    const key = `grouping/${index}`;
    if (!callFits(startedAt, BUILD_CALL_TIMEOUT_MS)) {
      return { ok: true, left: runs.length - index };
    }
    const answer = await groupRun(
      supabase,
      { owner, courseId },
      run,
      storedExams,
    );
    if (answer === "limit") return { ok: false, reason: dailyLimitReason };
    if (answer instanceof RateLimited) {
      return { ok: true, left: runs.length - index, waitMs: answer.waitMs };
    }
    if (answer === "failed") {
      if (!failedKeys.includes(key)) {
        return { ok: true, left: runs.length - index, failed: [key] };
      }
      answered.push({ groups: ownGroups(run), exams: [] });
      fallback = true;
      continue;
    }
    answered.push(answer);
  }

  const found = courseExams(answered);
  const examIds = await storeExams(supabase, {
    owner,
    courseId,
    exams: found.exams,
    stored: storedExams,
    // A run that fell back saw no exams, so the stored ones stay.
    keepOthers: fallback,
  });
  const exercises: ExerciseGroup[] = found.groups.map(({ exam, ...group }) => ({
    ...group,
    examId: exam === null ? null : examIds[exam]!,
  }));
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
  storedExams: readonly StoredExam[],
): Promise<RunAnswer | "limit" | "failed" | RateLimited> {
  const offered = offeredIds(run);
  const exams: GroupingExam[] = storedExams.map((exam, index) => ({
    id: `x${index + 1}`,
    name: exam.name,
  }));
  const storedOf = new Map(
    exams.map((exam, index) => [exam.id, storedExams[index]!.id]),
  );
  const items = (label: GroupingChunk["label"]): GroupingItem[] =>
    [...offered]
      .filter(([, chunk]) => chunk.label === label)
      .map(([id, chunk]) => ({
        id,
        material: chunk.material,
        heading: chunk.heading,
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
      ...groupingCallSettings(exercises, solutions, exams),
      messages: groupingMessages(exercises, solutions, exams),
    },
    groupingAnswerSchema(),
  );
  if (typeof answer === "string" || answer instanceof RateLimited) {
    return answer;
  }
  const found = checkedExams(answer.exams, storedOf);
  return {
    exams: found,
    groups: checkedGroups(
      answer.exercises,
      offered,
      new Set(found.map((exam) => exam.name)),
    ),
  };
}

type RunAnswer = { groups: CheckedGroup[]; exams: FoundExam[] };

type StoredExam = { id: string; name: string };

async function loadExams(
  supabase: AdminSupabase,
  courseId: string,
): Promise<StoredExam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("id, name")
    .eq("course_id", courseId)
    .order("position")
    .order("id");
  if (error) failed("Loading the exams", error);
  return data;
}

/**
 * Stores the found exams in order: one that continues a stored exam keeps
 * its row, and with it the Student's answer, under its new name and
 * position; the others are new. Unless `keepOthers`, a stored exam no
 * longer found goes, and its Exercises are in none. Returns each found
 * exam's id.
 */
async function storeExams(
  supabase: AdminSupabase,
  {
    owner,
    courseId,
    exams,
    stored,
    keepOthers,
  }: {
    owner: string;
    courseId: string;
    exams: FoundExam[];
    stored: readonly StoredExam[];
    keepOthers: boolean;
  },
): Promise<string[]> {
  const ids: string[] = [];
  for (const [position, exam] of exams.entries()) {
    if (exam.storedId !== null) {
      const { error } = await supabase
        .from("exams")
        .update({ name: exam.name, position })
        .eq("id", exam.storedId)
        .eq("course_id", courseId);
      if (error) failed("Storing an exam", error);
      ids.push(exam.storedId);
      continue;
    }
    const { data, error } = await supabase
      .from("exams")
      .insert({ owner, course_id: courseId, name: exam.name, position })
      .select("id")
      .single();
    if (error) failed("Storing an exam", error);
    ids.push(data.id);
  }
  const gone = stored.filter(({ id }) => !ids.includes(id)).map(({ id }) => id);
  if (!keepOthers && gone.length > 0) {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("course_id", courseId)
      .in("id", gone);
    if (error) failed("Removing the exams no longer found", error);
  }
  return ids;
}

/**
 * The exam step of a build, after the exercise extraction: gives each
 * stored Exercise the exam the grouping found for it (`set_exercise_exams`).
 */
export async function assignExams(courseId: string): Promise<StepOutcome> {
  "use step";
  const supabase = createAdminClient();
  const owner = await touchBuild(supabase, courseId);
  if (!owner) return { ok: true, left: null };
  const { groups } = await loadStoredGroups(supabase, courseId);
  const { error } = await supabase.rpc("set_exercise_exams", {
    p_course_id: courseId,
    p_exercises: (groups?.exercises ?? []).map((group) => ({
      questionChunkId: group.questionChunkIds[0]!,
      examId: group.examId ?? null,
    })),
  });
  if (error) failed("Giving the Exercises their exams", error);
  return { ok: true, left: 0 };
}

/**
 * The Course's exercise and solution chunks in Course order (Materials by
 * position, then chunks by position), each with its Material's name, the
 * heading it follows and its first characters.
 */
async function loadGroupingChunks(
  supabase: AdminSupabase,
  courseId: string,
): Promise<CourseChunk[]> {
  const [materials, chunks] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name")
      .eq("course_id", courseId)
      .order("position")
      .order("created_at")
      .order("id"),
    allRows("Loading the Course's exercises", (from, to) =>
      supabase
        .from("chunks")
        .select("id, material_id, position, label, markdown, heading")
        .eq("course_id", courseId)
        .in("label", ["exercise", "solution"])
        .order("material_id")
        .order("position")
        .range(from, to),
    ),
  ]);
  if (materials.error) failed("Loading the Materials", materials.error);
  return materials.data.flatMap((material) =>
    chunks
      .filter((chunk) => chunk.material_id === material.id)
      .map((chunk) => ({
        id: chunk.id,
        label: chunk.label as GroupingChunk["label"],
        material: material.name,
        heading: chunk.heading ?? "",
        text: chunk.markdown.slice(0, GROUPING_TEXT_CHARS),
      })),
  );
}
