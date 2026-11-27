/** The fixed fields of a Brief, each null until the Student has answered it. */
export type BriefFields = {
  /** The exam's date, as `YYYY-MM-DD`. */
  examDate: string | null;
  goal: "pass" | "good_grade" | "master_everything" | null;
  openBook: boolean | null;
  formulaSheet: boolean | null;
  calculator: boolean | null;
  /**
   * Whether the Student answered the scope step: the excluded Materials, the
   * old exams and the exam scope.
   */
  scopeConfirmed: boolean;
};

/** The longest a Brief's notes may grow, in characters (the column's check). */
export const MAX_BRIEF_NOTES_LENGTH = 20_000;

export type BriefMaterial = {
  id: string;
  name: string;
  excluded: boolean;
};

export type BriefExam = {
  id: string;
  /** As printed, such as "Klausur WS 2023/24". */
  name: string;
  /** The Student's answer: an old exam or not; null before they answered. */
  confirmed: boolean | null;
  asked: boolean;
};

/** An old exam of the Course: an exam the Student confirmed. */
export type OldExam = { id: string; name: string };

export type ReservedExam = {
  answered: boolean;
  examId: string | null;
};

/** The Course language that the build writes the Knowledge map in. */
type CourseLanguage = {
  /** An English name, such as German. */
  name: string;
  /** The Student's choice, the Materials' own, or English before any Material is parsed. */
  source: "chosen" | "materials" | "fallback";
};

/**
 * A stored exam scope: one Topic the exam leaves out or stresses, with its
 * subtree unless a Topic below has its own.
 */
export type BriefExamScope = {
  topicId: string;
  scope: "excluded" | "emphasized";
  words: string;
};

export type BriefTopic = {
  id: string;
  name: string;
  /** 0 at the top. */
  depth: number;
};

/** An admin text of the Materials, with where it first appears. */
export type AdminText = {
  text: string;
  /** "<Material> p. N". */
  source: string;
};

export type BriefContext = {
  fields: BriefFields;
  notes: string | null;
  /** The Course's Materials, oldest upload first. */
  materials: BriefMaterial[];
  /** Every exam the build found, in Course order, with the Student's answer. */
  foundExams: BriefExam[];
  /** The Course's old exams in Course order. */
  exams: OldExam[];
  reservedExam: ReservedExam;
  language: CourseLanguage;
  /** The Course's Topic tree in tree order: a parent before its children. */
  topics: BriefTopic[];
  examScopes: BriefExamScope[];
  /** The distinct admin texts of the Materials, in Course order. */
  adminTexts: AdminText[];
};

/**
 * Whether the Student has finished telling the AI about the exam: the scope
 * step was asked. The other fields may stay null, since a "don't know" is
 * not asked again.
 */
export function isIntakeDone(fields: BriefFields | null): boolean {
  return fields?.scopeConfirmed ?? false;
}

/**
 * The exam the reservation question suggests: with two or more, the last
 * in Course order; with only one, none, so that it stays for practice.
 */
export function suggestedReservation(exams: OldExam[]): OldExam | null {
  return exams.length < 2 ? null : (exams.at(-1) ?? null);
}
