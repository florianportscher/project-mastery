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
  /** The positions whose Show the solution the Student pressed. */
  solutionShown: Set<number>;
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
      const move = message.metadata?.move;
      if (move) {
        if (move.kind === "solution") {
          states.get(move.questionId)?.solutionShown.add(move.position);
        }
      } else if (answer) {
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
          solutionShown: new Set(),
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
    .map(
      (part) =>
        `Part ${part.position}: ${partWork(part, asked) || "(not answered)"}`,
    )
    .join("\n\n");
}

/** What the Student has put in a part: its option and text; "" for nothing. */
export function partWork(
  { position, text, choice }: PartAnswer,
  asked: Array<{ position: number; options: string[] | null }>,
): string {
  const option =
    choice === null
      ? undefined
      : asked.find((part) => part.position === position)?.options?.[choice];
  const why = text.trim();
  return [
    option === undefined ? "" : `${optionLetter(choice!)}) ${option}`,
    why === "" ? "" : option === undefined ? why : `Why: ${why}`,
  ]
    .filter((line) => line !== "")
    .join(" ");
}

/** The text of a press, as the model reads it. */
export function moveText(
  kind: "hint" | "solution",
  position: number,
  draft: string,
): string {
  if (kind === "solution") return `Show the solution of part ${position}.`;
  return draft === ""
    ? `Hint on part ${position}.`
    : `Hint on part ${position}. My work so far: ${draft}`;
}

/** What the Chat shows in place of a press's message. */
export function moveLabel(kind: "hint" | "solution", position: number): string {
  return kind === "hint"
    ? `Hint on part ${position}`
    : `Solution of part ${position}`;
}

/** An option's letter on the card: A for the first. */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
