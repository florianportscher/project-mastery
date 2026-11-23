import "server-only";
import { Output } from "ai";
import { z } from "zod";
import { KC_DEFINITION } from "@/features/knowledge-map/ai/kc-definition";
import { offeredId } from "@/features/knowledge-map/ai/offered-id";
import { aiTask } from "@/lib/ai/models";
import { promptDigest } from "@/lib/ai/prompt-digest";

export type OfferedExerciseUnit = {
  material: string;
  language: string;
  exercises: ReadonlyArray<{
    /** Short and only for the call, such as x1. */
    id: string;
    /** The whole statement: a shared stem and every subtask. */
    statement: string;
    /** Every printed solution of it; null without one. */
    solution: string | null;
  }>;
  /** Every live KC of the Course, in Course order. */
  kcs: ReadonlyArray<{
    id: string;
    /** The heading its first source follows; empty without one. */
    heading: string;
    name: string;
    description: string;
  }>;
};

/**
 * What the exercise call answers for these Exercise and KC ids. Any string
 * validates as an id (`offeredId`): code drops an unknown KC id, and an
 * Exercise with an unknown id is one the call left out.
 */
export const exerciseExtractionSchema = (
  exerciseIds: readonly string[] = [],
  kcIds: readonly string[] = [],
) =>
  z.object({
    exercises: z.array(
      z.object({
        id: offeredId(exerciseIds),
        notAnExercise: z
          .boolean()
          .describe(
            "True when it asks nothing of the Student, such as a heading or an instruction for the whole sheet.",
          ),
        kcIds: z
          .array(offeredId(kcIds))
          .describe(
            "The listed KCs its solution uses, most important first: usually 1 to 4, at most 6.",
          ),
        newKcs: z
          .array(
            z.object({
              name: z.string().describe("Short, in the course language."),
              description: z.string().describe("One line."),
            }),
          )
          .describe(
            "Only for a KC, as defined above, that no listed KC covers. Usually empty.",
          ),
        finalAnswers: z
          .array(
            z.object({
              label: z
                .string()
                .describe('What it is, such as "Number of solutions".'),
              value: z
                .string()
                .describe(
                  'The printed result as a mathjs expression, such as "12 kg*m/s^2", "[[1, 2], [0, 1]]", "[2, -3]", "n + 1" or "3 + 4i".',
                ),
              anyOrder: z
                .boolean()
                .describe(
                  "True for a list whose order does not matter, such as a set of eigenvalues.",
                ),
            }),
          )
          .describe(
            "Each mathematical final result the statement or the solution prints. Empty when neither prints one, or when the result is not mathematical, such as a proof or a sentence.",
          ),
      }),
    ),
  });

const EXERCISE_INSTRUCTIONS = `You get some exercises of a university course as JSON: the material's name, the course language, the exercises, each with an id, its whole statement (a shared introduction and every subtask) and all its printed solutions or null, and every knowledge component (KC) of the course so far, in course order, each with an id and the heading it was taught under. Answer for every exercise.

- Give the ids of the listed KCs a Student must master to solve it: the results and methods its solution uses as a step, most important first, usually 1 to 4, at most 6. A KC used in several subtasks counts once. Leave out a KC that only defines a notion the statement is written with when a more specific listed KC covers the step.
- When the exercise introduces a notion or derives a result that no listed KC teaches and that another exam task could ask for again, such as a named kind of object or a formula it proves, give it as a new KC, never a restatement of a listed one, with a short name and a one-line description. What a KC is, and how big:
${KC_DEFINITION}
- Copy each final result that the statement or the solution prints, as printed: a result the statement gives for checking, such as "Result: 12 solutions", or the result the printed solution arrives at, such as "so $\\dim W = 3$". Write it as a mathjs expression: a number with its unit ("12 kg*m/s^2"), a vector ("[2, -3]"), a matrix by rows ("[[1, 2], [0, 1]]"), a complex number ("3 + 4i") or an expression in the statement's symbols ("n + 1"). Mark a list whose order does not matter, such as a set of eigenvalues, as any order. Copy only a result every correct solution states identically: leave out one that depends on a choice the Student makes, such as a representative, an order, a parametrisation, an example or a counterexample. A statement the task asks to show is no result. A value of a parameter that the task asks for, such as the one for which no solution exists, is one. Give none for a result that is not mathematical, such as a proof or a sentence, and none when neither prints one: do not solve anything yourself.
- Mark an exercise that asks nothing of the Student, such as a heading or an instruction for the whole sheet, as not an exercise.
- Write every name and description in the course language. Formulas in LaTeX ($...$).`;

export const exerciseExtractionDigest = () =>
  promptDigest(EXERCISE_INSTRUCTIONS, exerciseExtractionSchema());

/**
 * Call settings for the extraction of one exercise unit (task `exercise`),
 * with reasoning on; it copies and matches, it does not solve.
 *
 *   streamText({ ...exerciseExtractionSettings(unit), messages: exerciseExtractionMessages(unit) })
 */
export function exerciseExtractionSettings(part: OfferedExerciseUnit) {
  return {
    ...aiTask("exercise"),
    reasoning: "medium" as const,
    instructions: EXERCISE_INSTRUCTIONS,
    output: Output.object({
      schema: exerciseExtractionSchema(
        part.exercises.map((exercise) => exercise.id),
        part.kcs.map((kc) => kc.id),
      ),
    }),
  };
}

export function exerciseExtractionMessages(part: OfferedExerciseUnit) {
  return [
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: JSON.stringify(part) }],
    },
  ];
}
