import type { BriefExam, OldExam } from "@/features/brief/domain/intake";

/**
 * Old exams are the exams the build's grouping call found in the
 * Materials, each a set of Exercises; the Student confirms or rejects each
 * once in the Brief.
 */

/** The Course's old exams: the exams the Student confirmed, in order. */
export function confirmedExams(exams: readonly BriefExam[]): OldExam[] {
  return exams
    .filter((exam) => exam.confirmed === true)
    .map(({ id, name }) => ({ id, name }));
}

/** The exams the static old-exam question asks about: unasked and unanswered. */
export function unaskedExams(exams: readonly BriefExam[]): OldExam[] {
  return exams
    .filter((exam) => !exam.asked && exam.confirmed === null)
    .map(({ id, name }) => ({ id, name }));
}

const OLD_EXAMS_PART = "data-old-exams";

/**
 * The part of the static old-exam question that lists the exams it asks
 * about. The model does not see data parts, and the page shows only text.
 */
export function oldExamsPart(examIds: string[]) {
  return { type: OLD_EXAMS_PART, data: { examIds } };
}

/**
 * The exams the Student was asked about: those the static old-exam
 * questions in `messages` listed and, while intake runs, every exam of the
 * context, as the AI asks about them itself.
 */
export function askedExamIds(
  messages: ReadonlyArray<{ parts: ReadonlyArray<{ type: string }> }>,
  intakeExamIds: readonly string[],
): string[] {
  const listed = messages.flatMap(({ parts }) =>
    parts.flatMap((part) =>
      part.type === OLD_EXAMS_PART
        ? ((part as ReturnType<typeof oldExamsPart>).data.examIds ?? [])
        : [],
    ),
  );
  return [...new Set([...listed, ...intakeExamIds])];
}

/**
 * The static question the Brief posts about the exams the build found and
 * the Brief did not ask about yet, each by its printed name.
 */
export function oldExamQuestion(
  exams: ReadonlyArray<{ name: string }>,
): string {
  const list = exams.map(({ name }) => `- ${name}`).join("\n");
  return exams.length === 1
    ? `This looks like an old exam. Is it one?\n${list}`
    : `These look like old exams. Which of them are?\n${list}`;
}
