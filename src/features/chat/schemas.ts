import { z } from "zod";
import { materialReferenceSchema } from "@/features/courses";
import type { TutorContext } from "@/features/study";

/** The longest message a Student can send, in characters. */
export const MAX_MESSAGE_LENGTH = 10_000;

export const messageTooLongMessage = `Your message is too long. Keep it under ${MAX_MESSAGE_LENGTH.toLocaleString("en-US")} characters.`;

export const chatNotFoundMessage = "This chat does not exist.";

/**
 * A message's metadata (see `ChatMessageMetadata`): what the server attaches
 * to AI messages.
 */
export const chatMessageMetadataSchema = z
  .object({
    modelId: z.string().optional(),
    stopped: z.boolean().optional(),
    // Built by the server and only displayed, so only its shape is checked.
    tutorContext: z
      .custom<TutorContext>(
        (value) =>
          typeof value === "object" && value !== null && !Array.isArray(value),
      )
      .optional(),
    usage: z
      .object({
        inputTokens: z.number(),
        cachedInputTokens: z.number(),
        outputTokens: z.number(),
        costUsd: z.number(),
        estimated: z.boolean(),
      })
      .optional(),
  })
  .optional();

export const MAX_ATTACHED_MATERIALS = 5;

export const tooManyMaterialsMessage = `Attach up to ${MAX_ATTACHED_MATERIALS} materials to a message.`;

const materialPartSchema = z.object({
  type: z.literal("data-material"),
  data: materialReferenceSchema,
});

const textPartSchema = z.object({ type: z.literal("text"), text: z.string() });

const studentMessageSchema = z.object({
  id: z.uuid(),
  role: z.literal("user"),
  parts: z
    .array(z.discriminatedUnion("type", [textPartSchema, materialPartSchema]))
    .min(1)
    .refine(
      (parts) =>
        parts.some(
          (part) => part.type === "data-material" || part.text.trim() !== "",
        ),
      "Your message is empty.",
    )
    .refine(
      (parts) =>
        parts.reduce(
          (length, part) =>
            length + (part.type === "text" ? part.text.length : 0),
          0,
        ) <= MAX_MESSAGE_LENGTH,
      messageTooLongMessage,
    )
    .refine(
      (parts) =>
        parts.filter((part) => part.type === "data-material").length <=
        MAX_ATTACHED_MATERIALS,
      tooManyMaterialsMessage,
    ),
});

/**
 * The body `useChat` posts to the Chat route: only the new message, as in the
 * AI SDK message persistence guide. `courseId` allows creating the Chat with
 * this id in that Course; without it the Chat must exist. `mockId`, with a
 * new Chat, has its Study session go through that graded Mock exam, and
 * `minutes` gives it the length the Student chose.
 */
export const chatRequestSchema = z.object({
  chatId: z.uuid(),
  courseId: z.uuid().optional(),
  mockId: z.uuid().optional(),
  minutes: z.union([z.literal(15), z.literal(30), z.literal(45)]).optional(),
  message: studentMessageSchema,
});

/** The longest title a Student can give a Chat, in characters. */
export const MAX_TYPED_TITLE_LENGTH = 100;

export const renameChatSchema = z.object({
  chatId: z.uuid(),
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(
      MAX_TYPED_TITLE_LENGTH,
      `Keep the title under ${MAX_TYPED_TITLE_LENGTH} characters.`,
    ),
});

export const chatIdSchema = z.object({ chatId: z.uuid() });

export const attachedMaterialSchema = z.object({ materialId: z.uuid() });

export const deleteChatSchema = chatIdSchema.extend({
  /** The Student is on the Chat's page, so they land on a new Chat. */
  leave: z.boolean().optional(),
});

export const openSourceSchema = z.discriminatedUnion("kind", [
  z.object({
    courseId: z.uuid(),
    kind: z.literal("section"),
    id: z.uuid(),
  }),
  z.object({
    courseId: z.uuid(),
    kind: z.literal("pages"),
    materialId: z.uuid(),
    pageFrom: z.number().int().min(1),
    pageTo: z.number().int().min(1),
  }),
]);
/** What the source pane shows for a source that is missing or not the Course's. */
export const sourceNotFoundMessage = "This source could not be found.";
