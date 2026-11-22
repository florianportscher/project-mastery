import "server-only";
import { Output } from "ai";
import { z } from "zod";
import { offeredId } from "@/features/knowledge-map/ai/offered-id";
import { aiTask } from "@/lib/ai/models";

export type OfferedKc = {
  /** Short and only for the call, such as k1. */
  id: string;
  /** The heading its first source follows; empty without one. */
  heading: string;
  name: string;
  description: string;
};

/** A name a KC assumes from outside the course, as text. */
export type OfferedName = {
  /** Short and only for the call, such as n1. */
  id: string;
  name: string;
  description: string;
  /** The KC that assumes it, as "name: description". */
  usedBy: string;
};

/**
 * What the check returns: for each name, the id of the KC it means, or
 * null. Any string validates as an id (`offeredId`): code reads an unknown
 * one as null.
 */
export function prerequisiteCheckSchema(
  names: readonly OfferedName[],
  kcs: readonly OfferedKc[],
) {
  const ids = kcs.map((kc) => kc.id);
  return z.object({
    meanings: z.object(
      Object.fromEntries(
        names.map((name) => [name.id, offeredId(ids).nullable()]),
      ),
    ),
  });
}

const CHECK_INSTRUCTIONS = `You get things that knowledge components (KCs) of a university course assume from outside the course, as JSON: each with a name, a one-line description and the KC that uses it (names), and the KCs that newly added materials teach (kcs). For each name, say which of these KCs it means.

- Pick a KC only when it means the same thing, so a student must know that KC to understand the one that uses it.
- Answer null when no KC is meant, or when you are not sure. Do not guess: a null answer keeps it as something the KC assumes from outside the course.`;

/** One check call: up to 50 names, and the KCs they may mean. */
export type CheckInput = {
  names: readonly OfferedName[];
  kcs: readonly OfferedKc[];
};

/**
 * Call settings for one Prerequisite check of a build (task `map`):
 *
 *   streamText({ ...prerequisiteCheckSettings(input), messages: prerequisiteCheckMessages(input) })
 */
export function prerequisiteCheckSettings(input: CheckInput) {
  return {
    ...aiTask("map"),
    reasoning: "medium" as const,
    instructions: CHECK_INSTRUCTIONS,
    output: Output.object({
      schema: prerequisiteCheckSchema(input.names, input.kcs),
    }),
  };
}

export function prerequisiteCheckMessages(input: CheckInput) {
  return [
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: JSON.stringify(input) }],
    },
  ];
}
