import type { UIMessage } from "ai";
import type { BriefFields } from "@/features/brief/domain/intake";

type BriefMessageMetadata = {
  modelId?: string;
};

export type BriefUIMessage = UIMessage<BriefMessageMetadata>;

/** What the study plan reads of a Brief; each null until answered. */
export type ExamFacts = Pick<BriefFields, "examDate" | "goal">;

export type BriefWithMessages = {
  courseId: string;
  messages: BriefUIMessage[];
  fields: BriefFields;
  /** Markdown the AI keeps about the exam; null when empty. */
  notes: string | null;
  /** When the notes last changed, as an ISO timestamp. */
  notesUpdatedAt: string | null;
  /** The Materials the exam excludes, oldest first, with their chunk page. */
  excludedMaterials: Array<{ id: string; name: string; href: string }>;
  /** The exams the Student confirmed as old exams, in Course order. */
  oldExams: Array<{ id: string; name: string }>;
  /** The exam scopes, each with its Topic's name. */
  examScopes: Array<{
    name: string;
    scope: "excluded" | "emphasized";
    words: string;
  }>;
  /**
   * The Student's answer to the reservation question: the reserved old
   * exams in order, each marked when a submitted Mock exam took it, or
   * "none"; null before they answered.
   */
  reservedExams: Array<{ name: string; taken: boolean }> | "none" | null;
};
