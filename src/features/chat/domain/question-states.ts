import { getToolName, isToolUIPart } from "ai";
import type { ChatUIMessage } from "@/features/chat/types";
import type { GradedPart, PartAnswer, PartResult } from "@/features/study";

/** Where a Question of a Chat stands, as its card shows it. */
export type QuestionState = {
  /** The Student's submitted answers by position; null before a Submit. */
  answers: Map<number, PartAnswer> | null;
  /** Each part's grade by position; null until graded. */
  verdicts: Map<number, GradedPart> | null;
  /**
   * Whether it takes a Submit: the Chat's newest Question, not yet
   * answered, graded or closed.
   */
  open: boolean;
};

/** What the card says for each part's result. */
export const VERDICT_LABELS: Record<PartResult, string> = {
  full: "Right",
  partial: "Partly right",
  wrong: "Not right",
  unanswered: "Not answered",
};

/**
 * Each Question of the Chat's messages by id: the answers its Submit sent,
 * its grade, and whether it is open. A message with a photo answers the
 * newest Question, and `closeQuestion` closes it. Pure.
 */
export function questionStates(
  messages: ChatUIMessage[],
): Map<string, QuestionState> {
  const states = new Map<string, QuestionState & { done: boolean }>();
  let newest: string | null = null;
  const done = (id: string | null) => {
    const state = id === null ? undefined : states.get(id);
    if (state) state.done = true;
  };
  for (const message of messages) {
    if (message.role === "user") {
      const answer = message.metadata?.answer;
      if (answer) {
        const state = states.get(answer.questionId);
        if (state) {
          state.answers = new Map(answer.parts.map((p) => [p.position, p]));
          state.done = true;
        }
      } else if (message.parts.some(({ type }) => type === "data-material")) {
        done(newest);
      }
      continue;
    }
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") continue;
      const output = part.output as Record<string, unknown> | null;
      const id = output?.questionId;
      const name = getToolName(part);
      if (name === "ask" && typeof id === "string") {
        states.set(id, {
          answers: null,
          verdicts: null,
          open: false,
          done: false,
        });
        newest = id;
      } else if (name === "grade" && typeof id === "string") {
        const state = states.get(id);
        if (state && Array.isArray(output?.parts)) {
          const parts = output.parts as GradedPart[];
          state.verdicts = new Map(parts.map((p) => [p.position, p]));
        }
        done(id);
      } else if (name === "closeQuestion") {
        done(newest);
      }
    }
  }
  return new Map(
    [...states].map(([id, { done, ...state }]) => [
      id,
      { ...state, open: id === newest && !done },
    ]),
  );
}

/**
 * The text of a Submit, which the model reads and the Question stores as
 * its answer: one paragraph per part, "Part 2: …", an empty one as not
 * answered.
 */
export function answerText(
  parts: PartAnswer[],
  asked: Array<{ position: number; options: string[] | null }>,
): string {
  return parts
    .map(({ position, text, choice }) => {
      const option =
        choice === null
          ? undefined
          : asked.find((part) => part.position === position)?.options?.[choice];
      const why = text.trim();
      const answer = [
        option === undefined ? "" : `${optionLetter(choice!)}) ${option}`,
        why === "" ? "" : option === undefined ? why : `Why: ${why}`,
      ]
        .filter((line) => line !== "")
        .join(" ");
      return `Part ${position}: ${answer === "" ? "(not answered)" : answer}`;
    })
    .join("\n\n");
}

/** An option's letter on the card: A for the first. */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
