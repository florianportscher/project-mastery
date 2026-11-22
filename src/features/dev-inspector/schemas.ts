import { z } from "zod";

export const chunkMarkdownSchema = z.object({ chunkId: z.uuid() });

/** The input of the action that loads one model call (a Langfuse observation id). */
export const callDetailSchema = z.object({
  callId: z.string().min(1),
});
