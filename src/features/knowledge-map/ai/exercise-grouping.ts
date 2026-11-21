import "server-only";
import { Output } from "ai";
import { z } from "zod";
import { offeredId } from "@/features/knowledge-map/ai/offered-id";
import { aiTask } from "@/lib/ai/models";

/** An exercise or solution chunk as the grouping call sees it. */
export type GroupingItem = {
  /** Short and only for the call, such as e1 or s1. */
  id: string;
  material: string;
  /** Its Chapter path, such as "4 Vector Spaces > 4.2 Subspaces". */
  chapter: string;
  /** Its first characters. */
  text: string;
};

/** How much of each chunk the grouping call sees, in characters. */
export const GROUPING_TEXT_CHARS = 600;

/**
 * What the grouping call answers for these offered ids. Any string
 * validates as an id (`offeredId`): code drops the unknown ones.
 */
export const groupingAnswerSchema = (
  exerciseIds: readonly string[] = [],
  solutionIds: readonly string[] = [],
) =>
  z.object({
    exercises: z
      .array(
        z.object({
          questionIds: z
            .array(offeredId(exerciseIds))
            .describe(
              "The exercise chunks of its statement in order: a stem shared by its subtasks, then every subtask.",
            ),
          solutionIds: z
            .array(offeredId(solutionIds))
            .describe(
              "Every solution chunk that solves it or one of its subtasks, wherever printed. Empty when none is given.",
            ),
        }),
      )
      .describe("Every exercise of the course, in course order."),
  });

const GROUPING_INSTRUCTIONS = `You group the exercise and solution texts of one university course into whole exercises. The course has exercise sheets, solution sheets, lecture notes with exercises and old exams with their solutions; a text is one piece of a printed page, so one exercise often spans several texts.

- You get every exercise text (e1, e2, …) and every solution text (s1, s2, …) in course order as JSON: its id, its material's name, its chapter path and the start of its text.
- Give each exercise once, with the exercise texts of its statement in order: an introduction or stem that its subtasks share belongs to them, and all subtasks of one numbered exercise (a), b), c) or (i), (ii)) belong to one exercise.
- Give each exercise every solution text that solves it or one of its subtasks, wherever it is printed: right after a subtask, at the end of the exercise, or in another material such as a solution sheet.
- Printed numbers, material names, chapter paths and what the texts say all tell. Numbers repeat across sheets, chapters and exams, so a number matches only within the same sheet, chapter or exam, or between an exercise sheet and its solution sheet.
- Put each text in at most one exercise. A solution whose exercise is not among the given texts goes in none. Do not guess.`;

/**
 * Call settings for a grouping call (task `ingest`), streamed so a long
 * reasoning does not hit Node's 5-minute headers timeout:
 *
 *   streamText({ ...groupingCallSettings(e, s), messages: groupingMessages(e, s) })
 */
export function groupingCallSettings(
  exercises: readonly GroupingItem[],
  solutions: readonly GroupingItem[],
) {
  return {
    ...aiTask("ingest"),
    reasoning: "high" as const,
    maxOutputTokens: 32000,
    instructions: GROUPING_INSTRUCTIONS,
    output: Output.object({
      schema: groupingAnswerSchema(
        exercises.map((item) => item.id),
        solutions.map((item) => item.id),
      ),
    }),
  };
}

/** The user message of a grouping call: both lists, as JSON. */
export function groupingMessages(
  exercises: readonly GroupingItem[],
  solutions: readonly GroupingItem[],
) {
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ exercises, solutions }),
        },
      ],
    },
  ];
}
