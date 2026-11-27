import "server-only";
import { z } from "zod";
import { briefPath } from "@/features/brief/domain/brief-paths";
import { isIntakeDone } from "@/features/brief/domain/intake";
import type { BriefFields } from "@/features/brief/domain/intake";
import {
  loadOldExams,
  loadTopics,
  loadFields,
  openBrief,
} from "@/features/brief/server/brief-store";
import { loadExamScopes } from "@/features/brief/server/exam-scopes";
import type { BriefWithMessages, ExamFacts } from "@/features/brief/types";
import { materialChunksPath } from "@/features/courses/server";
import { getUser, requireUser } from "@/lib/auth/user";
import { failed } from "@/lib/supabase/failed";
import { createClient } from "@/lib/supabase/server";
import type { Supabase } from "@/lib/supabase/types";

/**
 * The signed-in Student's Brief of a Course with its messages, created with
 * its static opening message when the Course has none yet, and with the
 * old-exam question posted for Materials parsed after intake (`openBrief`).
 * Null when the id is malformed or the Course is unknown or another
 * Student's (show not-found).
 */
export async function getBrief(
  courseId: string,
): Promise<BriefWithMessages | null> {
  await requireUser(briefPath(courseId));
  if (!z.uuid().safeParse(courseId).success) return null;

  const supabase = await createClient();
  const messages = await openBrief(supabase, courseId);
  if (!messages) return null;
  const panel = await loadPanelData(supabase, courseId);
  return { courseId, messages, ...panel };
}

async function loadPanelData(supabase: Supabase, courseId: string) {
  const [brief, excluded, exams, topics, scopes, reserved] = await Promise.all([
    supabase
      .from("briefs")
      .select(
        "exam_date, goal, open_book, formula_sheet, calculator, scope_confirmed, notes, notes_updated_at, reserved_exam_answered",
      )
      .eq("course_id", courseId)
      .single(),
    supabase
      .from("brief_excluded_materials")
      .select("material_id, materials(id, name, created_at)")
      .eq("course_id", courseId),
    loadOldExams(supabase, courseId),
    loadTopics(supabase, courseId),
    loadExamScopes(supabase, courseId),
    loadReservedExams(supabase, courseId),
  ]);
  if (brief.error) failed("Loading the Brief", brief.error);
  if (excluded.error) failed("Loading the excluded Materials", excluded.error);
  const { data } = brief;
  const fields: BriefFields = {
    examDate: data.exam_date,
    goal: data.goal as BriefFields["goal"],
    openBook: data.open_book,
    formulaSheet: data.formula_sheet,
    calculator: data.calculator,
    scopeConfirmed: data.scope_confirmed,
  };
  const excludedMaterials = excluded.data
    .flatMap((row) => row.materials ?? [])
    .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
    .map(({ id, name }) => ({
      id,
      name,
      href: materialChunksPath(courseId, id),
    }));
  return {
    fields,
    notes: data.notes,
    notesUpdatedAt: data.notes_updated_at,
    excludedMaterials,
    oldExams: exams,
    examScopes: scopes.flatMap(({ topicId, scope, words }) => {
      const topic = topics.find(({ id }) => id === topicId);
      return topic ? [{ name: topic.name, scope, words }] : [];
    }),
    reservedExams: reservedExamList(
      exams,
      data.reserved_exam_answered,
      reserved,
    ),
  };
}

/**
 * The panel's reserved exams: null before the Student answered, "none"
 * when they keep none.
 */
function reservedExamList(
  exams: Awaited<ReturnType<typeof loadOldExams>>,
  answered: boolean,
  reserved: Awaited<ReturnType<typeof loadReservedExams>>,
): BriefWithMessages["reservedExams"] {
  if (!answered) return null;
  const list = reserved.flatMap(({ id, taken }) => {
    const exam = exams.find((e) => e.id === id);
    return exam ? [{ name: exam.name, taken }] : [];
  });
  return list.length > 0 ? list : "none";
}

/**
 * The exam date and goal of a Course's Brief, read with
 * `supabase`, a Student's session client; each null when not set or without
 * a Brief.
 */
export async function getExamFacts(
  supabase: Supabase,
  courseId: string,
): Promise<ExamFacts> {
  const { data, error } = await supabase
    .from("briefs")
    .select("exam_date, goal")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) failed("Loading the Brief", error);
  return {
    examDate: data?.exam_date ?? null,
    goal: (data?.goal ?? null) as ExamFacts["goal"],
  };
}

/** The Brief's notes, read with `supabase`; null when empty or without a Brief. */
export async function getBriefNotes(
  supabase: Supabase,
  courseId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("briefs")
    .select("notes")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) failed("Loading the Brief's notes", error);
  return data?.notes?.trim() ? data.notes : null;
}

/**
 * The Brief's answers on the exam's aids, read with `supabase`, a Student's
 * session client or the admin client; each null when not answered or
 * without a Brief.
 */
export async function getExamAids(
  supabase: Supabase,
  courseId: string,
): Promise<Pick<BriefFields, "openBook" | "formulaSheet" | "calculator">> {
  const { data, error } = await supabase
    .from("briefs")
    .select("open_book, formula_sheet, calculator")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) failed("Loading the exam's aids", error);
  return {
    openBook: data?.open_book ?? null,
    formulaSheet: data?.formula_sheet ?? null,
    calculator: data?.calculator ?? null,
  };
}

/**
 * The Course's reserved exams in order, each with whether a submitted Mock
 * exam has taken it, read with `supabase`, a Student's session client or
 * the admin client.
 */
async function loadReservedExams(
  supabase: Supabase,
  courseId: string,
): Promise<Array<{ id: string; taken: boolean }>> {
  const [reserved, mocks] = await Promise.all([
    supabase
      .from("exams")
      .select("id")
      .eq("course_id", courseId)
      .eq("reserved", true)
      .order("position")
      .order("id"),
    supabase
      .from("mock_exams")
      .select("reserved_exam_id")
      .eq("course_id", courseId)
      .eq("status", "submitted")
      .not("reserved_exam_id", "is", null),
  ]);
  if (reserved.error) failed("Loading the reserved exams", reserved.error);
  if (mocks.error) failed("Loading the final mock exams", mocks.error);
  const taken = new Set(mocks.data.map((mock) => mock.reserved_exam_id));
  return reserved.data.map(({ id }) => ({ id, taken: taken.has(id) }));
}

/**
 * The ids of the Course's active reserved exams in order, read with
 * `supabase`, a Student's session client or the admin client: the reserved
 * ones that no submitted Mock exam has taken. While they are active, the
 * tutor, problem generation and every mock but a final one leave their
 * Exercises and their chunks out.
 */
export async function getReservedExams(
  supabase: Supabase,
  courseId: string,
): Promise<string[]> {
  return (await loadReservedExams(supabase, courseId))
    .filter(({ taken }) => !taken)
    .map(({ id }) => id);
}

/**
 * Whether the Student has finished telling the AI about the Course's exam
 * (`isIntakeDone`). False without a Brief or a signed-in Student.
 */
export async function getIntakeDone(courseId: string): Promise<boolean> {
  if (!z.uuid().safeParse(courseId).success) return false;
  if (!(await getUser())) return false;
  return isIntakeDone(await loadFields(await createClient(), courseId));
}
