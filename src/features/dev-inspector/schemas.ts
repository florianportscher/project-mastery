import { z } from "zod";

export const chunkMarkdownSchema = z.object({ chunkId: z.uuid() });

/** The input of the action that loads one model call (a Langfuse observation id). */
export const callDetailSchema = z.object({
  callId: z.string().min(1),
});

export const MAX_FLAG_NOTE_LENGTH = 1000;

/** What Send to developer sends: a Chat of a Course, or (no `chatId`) its map build. */
export const sendFlagSchema = z.object({
  courseId: z.uuid(),
  chatId: z.uuid().optional(),
  note: z.string().trim().max(MAX_FLAG_NOTE_LENGTH),
});
