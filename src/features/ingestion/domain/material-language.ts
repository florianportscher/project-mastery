/** A `materials.language` is 2 to 35 characters long. */
const LANGUAGE_CHARS = { min: 2, max: 35 };

/** The longest `materials.notes` gets. */
export const MAX_NOTES_CHARS = 1000;

/** What a page read answered about its pages, as stored with each page. */
export type PageAnswer = { language: string | null; notes: string | null };

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
  const counts = new Map<string, number>();
  for (const answer of answers) {
    const language = answer.language?.trim() ?? "";
    if (
      language.length < LANGUAGE_CHARS.min ||
      language.length > LANGUAGE_CHARS.max
    ) {
      continue;
    }
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  let language: string | null = null;
  for (const [name, count] of counts) {
    if (language === null || count > counts.get(language)!) language = name;
  }
  const notes = [
    ...new Set(answers.map((answer) => answer.notes?.trim() ?? "")),
  ].filter(Boolean);
  return {
    language,
    notes: notes.length > 0 ? notes.join("\n").slice(0, MAX_NOTES_CHARS) : null,
  };
}
