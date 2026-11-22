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

/** An exam found by an earlier grouping, as the grouping call sees it. */
export type GroupingExam = {
  /** Short and only for the call, such as x1. */
  id: string;
  name: string;
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
  examIds: readonly string[] = [],
) =>
  z.object({
    exams: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              'The exam\'s name as printed, with its term or date, such as "Klausur WS 2023/24" or "Final exam, July 2022".',
            ),
          continues: offeredId(examIds)
            .nullable()
            .describe(
              "The id of the earlier exam it is, when it is among them; null for a new one.",
            ),
        }),
      )
      .describe(
        "Every old exam, class test or mock exam of the course, in course order. Empty when there is none.",
      ),
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
          exam: z
            .string()
            .nullable()
            .describe(
              "The name of the exam it is a task of, exactly as in exams; null when it is in no exam.",
            ),
        }),
      )
      .describe("Every exercise of the course, in course order."),
  });

const GROUPING_INSTRUCTIONS = `You group the exercise and solution texts of one university course into whole exercises. The course has exercise sheets, solution sheets, lecture notes with exercises and old exams with their solutions; a text is one piece of a printed page, so one exercise often spans several texts.

- You get every exercise text (e1, e2, …) and every solution text (s1, s2, …) in course order as JSON: its id, its material's name, its chapter path and the start of its text. You also get the exams found earlier (x1, x2, …) by name.
- Give each exercise once, with the exercise texts of its statement in order: an introduction or stem that its subtasks share belongs to them, and all subtasks of one numbered exercise (a), b), c) or (i), (ii)) belong to one exercise.
- Give each exercise every solution text that solves it or one of its subtasks, wherever it is printed: right after a subtask, at the end of the exercise, or in another material such as a solution sheet.
- Printed numbers, material names, chapter paths and what the texts say all tell. Numbers repeat across sheets, chapters and exams, so a number matches only within the same sheet, chapter or exam, or between an exercise sheet and its solution sheet.
- Put each text in at most one exercise. A solution whose exercise is not among the given texts goes in none. Do not guess.
- List every old exam among the texts: a past exam, resit, class test or mock exam of the course, whether it is a material of its own, one of several exams in one material, or the end of a script. Exercise sheets and the exercises of lecture notes are no exams. Name each exam as printed, with its term or date, so that two exams never share a name. When it is one of the exams found earlier, give that exam's id in continues.
- Give each exercise of an exam that exam's name; every other exercise gets null.`;

/**
 * Call settings for a grouping call (task `ingest`), streamed so a long
 * reasoning does not hit Node's 5-minute headers timeout:
 *
 *   streamText({ ...groupingCallSettings(e, s), messages: groupingMessages(e, s) })
 */
export function groupingCallSettings(
  exercises: readonly GroupingItem[],
  solutions: readonly GroupingItem[],
  exams: readonly GroupingExam[] = [],
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
        exams.map((exam) => exam.id),
      ),
    }),
  };
}

/** The user message of a grouping call: the lists, as JSON. */
export function groupingMessages(
  exercises: readonly GroupingItem[],
  solutions: readonly GroupingItem[],
  exams: readonly GroupingExam[] = [],
) {
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ exams, exercises, solutions }),
        },
      ],
    },
  ];
}
