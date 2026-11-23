/**
 * The languages a parse finds. Languages are English names, such as
 * German, as the page reads give them.
 */

/** A `materials.language` is 2 to 35 characters long. */
const LANGUAGE_CHARS = { min: 2, max: 35 };

export const MAX_NOTES_CHARS = 1000;

export type PageAnswer = { language: string | null; notes: string | null };

/** The most common of `languages`, the first given on a tie. */
function mostCommon(languages: readonly string[]): string | null {
  const counts = new Map<string, number>();
  for (const language of languages) {
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [language, count] of counts) {
    if (best === null || count > counts.get(best)!) best = language;
  }
  return best;
}

/**
 * A Material's language and notes from its page reads, in page order: the
 * language most pages name (the first named on a tie), ignoring one that
 * does not fit `materials.language`; the distinct notes joined, cut to
 * MAX_NOTES_CHARS. Null each when no page gave one.
 */
export function materialLanguageAndNotes(answers: readonly PageAnswer[]): {
  language: string | null;
  notes: string | null;
} {
  const languages = answers
    .map((answer) => answer.language?.trim() ?? "")
    .filter(
      (language) =>
        language.length >= LANGUAGE_CHARS.min &&
        language.length <= LANGUAGE_CHARS.max,
    );
  const notes = [
    ...new Set(answers.map((answer) => answer.notes?.trim() ?? "")),
  ].filter(Boolean);
  return {
    language: mostCommon(languages),
    notes: notes.length > 0 ? notes.join("\n").slice(0, MAX_NOTES_CHARS) : null,
  };
}

/**
 * The Course language: the most common language of its Materials in
 * Course order, the earlier one on a tie; English when none has one.
 */
export function courseLanguage(languages: ReadonlyArray<string | null>) {
  return (
    mostCommon(languages.flatMap((language) => (language ? [language] : []))) ??
    "English"
  );
}
