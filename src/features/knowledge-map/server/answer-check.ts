import "server-only";
import {
  checkAnswer as checkAnswerUnbounded,
  checkAnswers as checkAnswersUnbounded,
  checkEachAnswer as checkEachAnswerUnbounded,
  UnreadableAnswerError,
  type AnswerCheck,
  type AnswerKey,
  type GivenValue,
} from "@/features/knowledge-map/domain/answer-keys";
import { TimeLimitError, withinTime } from "@/lib/time-limit";

/**
 * The answer check for server code: `domain/answer-keys.ts` under a time
 * limit per value. A key comes from a Material and a value from a Student,
 * and mathjs evaluates both in the server's process, where a short
 * expression such as `combinations(1e15, 5e14)` runs for minutes. A check
 * that takes a few milliseconds is stopped at the limit, and its value
 * counts as one mathjs cannot read.
 */

/** The longest one value's check may run: a usual one takes under 5 ms. */
const CHECK_TIME_LIMIT_MS = 250;

/**
 * `checkAnswer` under the time limit: throws `UnreadableAnswerError` for a
 * value whose check ran over it, as for one mathjs cannot parse.
 */
export function checkAnswer(key: AnswerKey, value: string): AnswerCheck {
  try {
    return withinTime(CHECK_TIME_LIMIT_MS, () =>
      checkAnswerUnbounded(key, value),
    );
  } catch (error) {
    if (!(error instanceof TimeLimitError)) throw error;
    throw new UnreadableAnswerError(`"${value}" takes too long to check.`);
  }
}

/** `checkAnswers` with each value's check under the time limit. */
export function checkAnswers(
  keys: readonly AnswerKey[],
  given: readonly GivenValue[],
) {
  return checkAnswersUnbounded(keys, given, checkAnswer);
}

/** `checkEachAnswer` with each value's check under the time limit. */
export function checkEachAnswer(
  keys: readonly AnswerKey[],
  given: readonly GivenValue[],
) {
  return checkEachAnswerUnbounded(keys, given, checkAnswer);
}
