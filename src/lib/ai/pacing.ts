import "server-only";
import { getAiEnv } from "@/lib/ai/env";

let nextStartAt = 0;

/**
 * Waits until a workflow's model call may start: with `AI_RPM` set, calls
 * start 60 / AI_RPM seconds apart, so the rate limit of the free credit
 * (5 requests per minute) is not met. Unset, it returns at once. Calls that
 * ask together are given consecutive slots. The pace holds within one
 * server instance; a limit met anyway, such as from a Chat or a second
 * workflow on the same key, stays with the wait after a rate limit. It
 * returns the milliseconds waited, so a caller can take them off the call's
 * time limit.
 */
export async function paceCall(): Promise<number> {
  const rpm = getAiEnv().AI_RPM;
  if (!rpm) return 0;
  const startAt = Math.max(Date.now(), nextStartAt);
  nextStartAt = startAt + 60_000 / rpm;
  const waitMs = startAt - Date.now();
  if (waitMs <= 0) return 0;
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return waitMs;
}
