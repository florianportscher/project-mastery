"use server";

import "server-only";
import {
  callDetailSchema,
  chunkMarkdownSchema,
} from "@/features/dev-inspector/schemas";
import { isDeveloper } from "@/features/dev-inspector/server/access";
import { getCallDetail } from "@/features/dev-inspector/server/calls";
import type { DevCallDetail } from "@/features/dev-inspector/types";
import { getChunkMarkdown } from "@/features/dev-inspector/server/snapshot";
import { getUser } from "@/lib/auth/user";
import {
  parseActionInput,
  signedOut,
  type ActionResult,
} from "@/lib/validation/action";

const NOT_FOUND = { ok: false, message: "Not found." } as const;

/**
 * One chunk's Markdown for the developer view, loaded on click. Not found
 * in production, for any account but a developer, and for another
 * Student's chunk.
 */
export async function loadChunkMarkdown(input: {
  chunkId: string;
}): Promise<ActionResult<string>> {
  if (!(await getUser())) {
    return signedOut;
  }
  const parsed = parseActionInput(chunkMarkdownSchema, input);
  if (!parsed.ok) return parsed;
  if (!(await isDeveloper())) return NOT_FOUND;
  const markdown = await getChunkMarkdown(parsed.data.chunkId);
  return markdown === null ? NOT_FOUND : { ok: true, data: markdown };
}

/**
 * One model call with its full input and output, loaded when the developer
 * opens it. Not found in production, for any account but a developer, and
 * for a call of another Student's Course.
 */
export async function loadCallDetail(input: {
  callId: string;
}): Promise<ActionResult<DevCallDetail>> {
  if (!(await getUser())) {
    return signedOut;
  }
  const parsed = parseActionInput(callDetailSchema, input);
  if (!parsed.ok) return parsed;
  if (!(await isDeveloper())) return NOT_FOUND;
  try {
    const call = await getCallDetail(parsed.data.callId);
    return call === null ? NOT_FOUND : { ok: true, data: call };
  } catch (error) {
    console.error("Reading a call from Langfuse failed:", error);
    return { ok: false, message: "Langfuse did not answer." };
  }
}
