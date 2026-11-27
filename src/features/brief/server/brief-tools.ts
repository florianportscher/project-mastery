import "server-only";
import type {
  BriefToolActions,
  SaveBriefInput,
  SetExamScopeInput,
} from "@/features/brief/ai/tools";
import type { BriefContext } from "@/features/brief/domain/intake";
import {
  addBriefNote,
  saveBrief,
  type BriefFieldsUpdate,
} from "@/features/brief/server/brief-store";
import { storeExamScope } from "@/features/brief/server/exam-scopes";
import type { Supabase } from "@/lib/supabase/types";

/** Null, as the models send for a field they leave out, means "not given". */
const given = <T>(value: T | null | undefined) => value ?? undefined;

/** Text as `setExamScope` compares it: lower case, whitespace collapsed. */
const plain = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * What the Brief's tools do, as the signed-in Student, to the Course's
 * Brief. `context` holds the Course's Materials, found exams and Topics
 * when the reply started, `studentTexts` the Student's messages so far and
 * `askedExamIds` the found exams the Student was asked about. Each tool
 * writes in one transaction, so a failed call changes nothing.
 */
export function briefToolActions(
  supabase: Supabase,
  courseId: string,
  context: BriefContext,
  studentTexts: string[],
  askedExamIds: string[],
): BriefToolActions {
  const known = (ids: Iterable<string>) => {
    const set = new Set(ids);
    return (given: string[] | undefined) => ({
      kept: given?.filter((id) => set.has(id)) ?? null,
      unknown: given?.filter((id) => !set.has(id)) ?? [],
    });
  };
  const ofMaterials = known(context.materials.map(({ id }) => id));
  const ofExams = known(context.foundExams.map(({ id }) => id));

  return {
    async saveBrief(input: SaveBriefInput) {
      const fields: BriefFieldsUpdate = Object.fromEntries(
        Object.entries({
          exam_date: given(input.examDate),
          goal: given(input.goal),
          open_book: given(input.openBook),
          formula_sheet: given(input.formulaSheet),
          calculator: given(input.calculator),
          scope_confirmed: given(input.scopeConfirmed),
        }).filter(([, value]) => value !== undefined),
      );

      // Only the Course's own Materials and found exams count; other ids
      // are dropped.
      const excluded = ofMaterials(given(input.excludedMaterialIds));
      const exams = ofExams(given(input.examIds));

      // Only old exams of the Course can be reserved; other ids are dropped.
      const oldExamIds = new Set(
        exams.kept ?? context.exams.map(({ id }) => id),
      );
      const reserved = known(oldExamIds)(given(input.reservedExamIds));
      if (reserved.kept) fields.reserved_exam_answered = true;

      await saveBrief(supabase, courseId, fields, {
        excludedMaterialIds: excluded.kept,
        examIds: exams.kept,
        askedExamIds,
        language: given(input.courseLanguage)?.trim() || null,
        reservedExamIds: reserved.kept,
      });
      const ignored = [
        excluded.unknown.length > 0 &&
          `These are no Material ids of the Course and were ignored: ${excluded.unknown.join(", ")}. Send excludedMaterialIds again with ids from the Course's Materials.`,
        exams.unknown.length > 0 &&
          `These are no ids of the exams found in the Course and were ignored: ${exams.unknown.join(", ")}. Send examIds again with ids from the found exams.`,
        reserved.unknown.length > 0 &&
          `These are no ids of old exams and were left out of the reserved exams: ${reserved.unknown.join(", ")}. If the Student said they are old exams, send reservedExamIds again together with examIds that list every old exam, these included.`,
      ].filter(Boolean);
      return ["Saved.", ...ignored].join(" ");
    },

    async addNote(text) {
      return (await addBriefNote(supabase, courseId, text))
        ? "Saved."
        : "Not saved: the notes are full. Nothing changed.";
    },

    async setExamScope(input: SetExamScopeInput) {
      const { topicId } = input;
      if (!context.topics.some(({ id }) => id === topicId)) {
        return `Not saved: ${topicId} is no Topic of the Course. Nothing changed.`;
      }
      const words = given(input.words) ?? null;
      if (input.scope !== null) {
        // The Student confirms: their words must come from their messages.
        const said = words !== null && plain(words) !== "";
        if (
          !said ||
          !studentTexts.some((text) => plain(text).includes(plain(words)))
        ) {
          return "Not saved: words must quote the Student's own confirmation from their message. Ask the Student to confirm it in their own words first. Nothing changed.";
        }
      }
      const stored = await storeExamScope(supabase, courseId, {
        topicId,
        scope: input.scope,
        words: input.scope === null ? null : words,
      });
      if (!stored)
        return "Not saved: the Brief was not found. Nothing changed.";
      return input.scope === null ? "Removed." : "Saved.";
    },
  };
}
