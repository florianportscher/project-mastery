import "server-only";
import { Output } from "ai";
import { z } from "zod";
import { offeredId } from "@/features/knowledge-map/ai/offered-id";
import { aiTask } from "@/lib/ai/models";

export type OfferedChunk = {
  /** Short and only for the call, such as c1. */
  id: string;
  /** The heading it follows; null before its Material's first. */
  heading: string | null;
  markdown: string;
};

/** A KC the Course's Materials taught so far, as the call is offered it. */
export type KnownKc = {
  /** Short and only for the call, such as k1. */
  id: string;
  /** The heading its first source follows; empty without one. */
  heading: string;
  name: string;
  description: string;
};

export type OfferedUnit = {
  material: string;
  language: string;
  chunks: readonly [OfferedChunk, ...OfferedChunk[]];
  /** Every live KC stored so far, in Course order. */
  knownKcs: readonly KnownKc[];
};

/**
 * What the extraction call returns for a unit with these chunk and known
 * KC ids. Any string validates as an id (`offeredId`): code drops a KC
 * without a known chunk id, a repeat of an unknown KC and a Prerequisite
 * with an unknown id.
 */
export const chapterExtractionSchema = (
  chunkIds: readonly string[] = [],
  knownIds: readonly string[] = [],
) =>
  z.object({
    repeats: z
      .array(
        z.object({
          kcId: offeredId(knownIds).describe("The id of the known KC."),
          chunkIds: z
            .array(offeredId(chunkIds))
            .describe("The chunks that teach it here."),
        }),
      )
      .describe(
        "Known KCs this unit teaches again, with the chunks that teach them here. Empty when none.",
      ),
    kcs: z.array(
      z.object({
        id: z.string().describe("An id for this answer: n1, n2, …"),
        name: z.string().describe("Short, in the course language."),
        description: z
          .string()
          .describe("One line: what it states or how it is done."),
        chunkIds: z
          .array(offeredId(chunkIds))
          .describe(
            "The chunks that teach it, at least one; not a chunk that only announces or recalls it.",
          ),
        prerequisites: z
          .array(z.string())
          .describe(
            "Ids of the KCs it uses directly: known KCs, or new KCs that come before it in this unit.",
          ),
        outside: z
          .array(
            z.object({
              name: z.string().describe("Short, in the course language."),
              description: z
                .string()
                .describe("One line: what it states or what it is."),
            }),
          )
          .describe(
            "Up to 3 things it uses that no listed KC teaches. Usually empty.",
          ),
      }),
    ),
  });

const EXTRACTION_INSTRUCTIONS = `You get one unit of a university course's materials as JSON: the material's name, the course language, the unit's chunks in reading order, each with an id, the heading it follows and its Markdown, and the knowledge components (KCs) the course's materials taught so far (knownKcs, in course order, each with an id and the heading it was taught under). List the KCs this unit teaches.

- A KC is one thing the unit teaches: a statement to know, an idea to understand, a method to carry out or when to use which method. Size it as one exam task: something a single task could test and a Student could learn in one sitting. A slide, a page or a section is not the unit of size; the same KC may span several of them, and one of them may hold several KCs or none.
- Together, the unit's KCs cover what it teaches. Do not split one thing into several KCs or merge several into one.
- Headings, overviews, summaries, the organisation of the course, lists of notation or conventions, repeated material and asides the course does not ask for (history, cost, outlooks beyond the course) are no KCs.
- An overview, aside, example, counterexample, caution or remark belongs to the KC it serves. Give it a KC of its own only when an exam task could test it alone. A description states the KC itself, without examples or their numbers.
- The headings only show where a chunk sits: take KCs only from the chunks' text. A chunk that is only a heading teaches nothing.
- When the unit teaches again what one of knownKcs already teaches, do not write that KC anew: give its id under repeats, with the ids of the chunks that teach it here.
- Give each new KC an id (n1, n2, …), a short name, a one-line description and the ids of the chunks that teach it.
- For each new KC, give its Prerequisites as ids: known KCs, or new KCs that come before it in this unit.
- A Prerequisite is a KC that this KC uses directly: a notion its statement is written with, a result its proof cites, or a method its own method runs.
- Choose from every listed KC, also from far earlier in the course or from other materials. List each KC that is used, not only the most important one. You need not repeat what its Prerequisites build on in turn.
- outside: up to 3 things it uses that no listed KC teaches, as short names, each with a one-line description. Leave out everyday knowledge that a university student of this subject cannot lack. Usually empty.
- Write every name and description in the course language. Formulas in LaTeX ($...$).`;

/**
 * Call settings for the extraction of one teaching unit (task `map`), with
 * reasoning on:
 *
 *   streamText({ ...chapterExtractionSettings(unit), messages: chapterExtractionMessages(unit) })
 */
export function chapterExtractionSettings(unit: OfferedUnit) {
  return {
    ...aiTask("map"),
    reasoning: "medium" as const,
    instructions: EXTRACTION_INSTRUCTIONS,
    output: Output.object({
      schema: chapterExtractionSchema(
        unit.chunks.map((chunk) => chunk.id),
        unit.knownKcs.map((kc) => kc.id),
      ),
    }),
  };
}

export function chapterExtractionMessages(unit: OfferedUnit) {
  return [
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: JSON.stringify(unit) }],
    },
  ];
}
