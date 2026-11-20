import { z } from "zod";

/** The input of the action that loads one chunk's Markdown. */
export const chunkMarkdownSchema = z.object({ chunkId: z.uuid() });
