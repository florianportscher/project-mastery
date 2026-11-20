import { z } from "zod";

/** The input of the action that loads one chunk's Markdown. */
export const chunkMarkdownSchema = z.object({ chunkId: z.uuid() });

/** The input of the action that loads one model call (a Langfuse observation id). */
export const callDetailSchema = z.object({
  callId: z.string().regex(/^[\w-]{1,64}$/),
});
