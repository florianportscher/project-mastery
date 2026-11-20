"use server";

import "server-only";
import { chunkMarkdownSchema } from "@/features/dev-inspector/schemas";
import { isDeveloper } from "@/features/dev-inspector/server/access";
import { getChunkMarkdown } from "@/features/dev-inspector/server/snapshot";
import { getUser } from "@/lib/auth/user";
import { parseActionInput, type ActionResult } from "@/lib/validation/action";

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
    return { ok: false, message: "Sign in again to continue." };
  }
  const parsed = parseActionInput(chunkMarkdownSchema, input);
  if (!parsed.ok) return parsed;
  if (!(await isDeveloper())) return NOT_FOUND;
  const markdown = await getChunkMarkdown(parsed.data.chunkId);
  return markdown === null ? NOT_FOUND : { ok: true, data: markdown };
}
