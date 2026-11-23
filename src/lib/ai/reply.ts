import {
  APICallError,
  InvalidToolInputError,
  NoSuchToolError,
  RetryError,
} from "ai";
import { gatewayRateLimitWaitMs } from "@/lib/ai/rate-limit";

/**
 * Pieces every streamed reply shares, in a Chat and in the Brief: the text of
 * a message and the error the Student sees when a reply fails.
 */

export function messageText(
  parts: readonly { type: string; text?: unknown }[],
): string {
  return parts
    .map((part) =>
      part.type === "text" && typeof part.text === "string" ? part.text : "",
    )
    .join("");
}

/**
 * Whether a failed model call met a rate limit: a 429 `APICallError`, also
 * inside a `RetryError` when the call was retried, or AI Gateway's own
 * per-minute limit, which is no `APICallError`.
 */
function isRateLimited(error: unknown): boolean {
  if (RetryError.isInstance(error)) return isRateLimited(error.lastError);
  if (APICallError.isInstance(error)) return error.statusCode === 429;
  return gatewayRateLimitWaitMs(error) !== null;
}

/** A tool call the model got wrong, as the AI SDK names it in a string. */
const TOOL_CALL_ERROR = /^AI_(InvalidToolInputError|NoSuchToolError): /;

/**
 * The error the Student sees when a reply fails mid-stream. A tool call the
 * model got wrong keeps its own message: it is stored as the tool's error and
 * tells the model what to fix on the next step and the next turn.
 */
export function replyErrorMessage(error: unknown): string {
  if (InvalidToolInputError.isInstance(error)) return error.message;
  if (NoSuchToolError.isInstance(error)) return error.message;
  // The AI SDK hands an invalid call's error to `onError` a second time as a
  // string, for the call's own part (`tool-error` from `streamText`).
  if (typeof error === "string" && TOOL_CALL_ERROR.test(error)) return error;
  return isRateLimited(error)
    ? "The AI is busy right now. Please try again in a moment."
    : "The AI could not reply. Please try again.";
}
