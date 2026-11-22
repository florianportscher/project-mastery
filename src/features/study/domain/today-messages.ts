/**
 * The first messages the Today card's buttons send as the Student in a new
 * Chat. The new Chat page sends only these, so a link can't put other words
 * in the Student's mouth.
 */
export const TODAY_MESSAGES = {
  start: "Let's start.",
  review: "Let's review.",
  exam: "Exam problems please.",
} as const;

/** The fixed messages the Chat's quick replies send as the Student. */
export const QUICK_REPLIES = [
  "Explain it differently.",
  "Show me an example.",
  "I know this, test me.",
  "Let's wrap up.",
] as const;

/** The session lengths the Today card offers, in minutes. */
export const SESSION_LENGTHS = [15, 30, 45] as const;

export function sessionLength(value: unknown): number | undefined {
  const minutes = Number(value);
  return SESSION_LENGTHS.find((length) => length === minutes);
}

/** The first message of a Chat opened to go through a graded Mock exam. */
export const MOCK_REVIEW_MESSAGE = "Let's go through my mock exam.";

export function isTodayMessage(text: unknown): text is string {
  return Object.values(TODAY_MESSAGES).some((message) => message === text);
}
