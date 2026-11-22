import "server-only";
import { Output } from "ai";
import { z } from "zod";
import { offeredId } from "@/features/knowledge-map/ai/offered-id";
import { MAX_TOPIC_NAME } from "@/features/knowledge-map/domain/topic-tree";
import { aiTask } from "@/lib/ai/models";

type OfferedKc = {
  /** Short and only for the call, such as k1. */
  id: string;
  name: string;
  /** The Material of its first source. */
  material: string;
  /** The heading over its first source; empty without one. */
  heading: string;
};

type OfferedStoredTopic = {
  /** Short and only for the call, such as t1. */
  id: string;
  name: string;
  /** 1 at the top. */
  level: number;
  /** The ids of the KCs it holds itself. */
  kcs: string[];
};

export type OfferedCourse = {
  /** The Course language by name, such as English. */
  language: string;
  /** Every live KC, in Course order. */
  kcs: OfferedKc[];
  storedTopics: OfferedStoredTopic[];
};

/**
 * What the tree call returns: the Topics in tree order as a flat list,
 * each with its level, so the schema needs no recursion. Ids are hints
 * that code checks (`offeredId`).
 */
export const topicTreeSchema = (
  kcIds: readonly string[] = [],
  topicIds: readonly string[] = [],
) =>
  z.object({
    topics: z
      .array(
        z.object({
          level: z
            .int()
            .min(1)
            .describe(
              "1 for a top-level Topic, 2 for a Topic inside the nearest level-1 Topic before it.",
            ),
          name: z
            .string()
            .describe(
              `At most ${MAX_TOPIC_NAME} characters, without numbering.`,
            ),
          kcIds: z
            .array(offeredId(kcIds))
            .describe(
              "The KCs this Topic holds itself; empty when it only groups child Topics.",
            ),
          centralQuestion: z
            .string()
            .describe(
              "The one question its own KCs together answer; empty when it holds no KCs.",
            ),
          continues: z
            .string()
            .meta(topicIds.length > 0 ? { enum: ["", ...topicIds] } : {})
            .describe(
              "The id of the stored Topic it continues; empty for a new Topic.",
            ),
        }),
      )
      .describe("Every Topic in tree order: a parent before its children."),
  });

const TREE_INSTRUCTIONS = `You get the knowledge components (KCs) of a university course as JSON, in course order, each with the material and heading it comes from, and the course's stored Topic tree. Group the KCs into Topics a student learns one at a time.

- A Topic is one subject the student learns as a block: usually a few to about ten KCs that belong together. Never make a Topic of a single KC when a neighbouring Topic fits it.
- Group by subject, not by material or heading: where several materials teach the same subject, such as slides, a script and an exercise sheet, put their KCs in the same Topic. Headings only hint at what belongs together.
- Give every KC to exactly one Topic, by its id.
- The tree has at most two levels. A level-1 Topic with children only groups them and holds no KCs itself; use one only where several Topics form one larger subject. List the Topics in tree order, each child right after its parent.
- Keep the course order where you can: a Topic's KCs come mostly from one stretch of the course.
- Name each Topic after its subject, without numbering, so that it is understood without its parent: "Vector spaces: definition and examples", not "Definition and examples". Never name a Topic after a single slide or page. Give a Topic that holds KCs the one question its KCs together answer.
- When a Topic is a stored one, kept or changed, give that stored Topic's id under continues, so the student's notes on it stay. Use each stored id at most once.
- Write in the course language. Formulas in LaTeX ($...$).`;

/**
 * Call settings for the tree call of a Course (task `topic`), with
 * reasoning on:
 *
 *   streamText({ ...topicTreeSettings(c), messages: topicTreeMessages(c) })
 */
export function topicTreeSettings(course: OfferedCourse) {
  return {
    ...aiTask("topic"),
    reasoning: "high" as const,
    instructions: TREE_INSTRUCTIONS,
    output: Output.object({
      schema: topicTreeSchema(
        course.kcs.map((kc) => kc.id),
        course.storedTopics.map((topic) => topic.id),
      ),
    }),
  };
}

export function topicTreeMessages(course: OfferedCourse) {
  return [
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: JSON.stringify(course) }],
    },
  ];
}
