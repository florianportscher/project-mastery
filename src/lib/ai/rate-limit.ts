import { APICallError, RetryError } from "ai";

const DEFAULT_WAIT_MS = 60_000;

/**
 * How long to wait before calling again after the AI Gateway's per-minute
 * rate limit (`GatewayRateLimitError`, no `APICallError`), in milliseconds,
 * or null when `error` is another one. The wait is the one its message
 * names: "Retry after 20s."
 */
export function gatewayRateLimitWaitMs(error: unknown): number | null {
  if (RetryError.isInstance(error)) {
    return gatewayRateLimitWaitMs(error.lastError);
  }
  if (!(error instanceof Error) || error.name !== "GatewayRateLimitError") {
    return null;
  }
  const seconds = Number.parseFloat(
    /retry after (\d+(?:\.\d+)?)s/i.exec(error.message)?.[1] ?? "",
  );
  return Number.isFinite(seconds) ? seconds * 1000 : DEFAULT_WAIT_MS;
}

/**
 * Whether a model call failed because the provider's daily request quota is
 * used up: a 429 whose body names a per-day quota. Waiting does not clear it
 * before the daily reset, so a workflow stops instead of retrying. A per-minute
 * 429 is not one; the step's retries outlast it.
 */
export function isDailyQuotaError(error: unknown): boolean {
  if (RetryError.isInstance(error)) return isDailyQuotaError(error.lastError);
  return (
    APICallError.isInstance(error) &&
    error.statusCode === 429 &&
    /per\s*day|daily/i.test(error.responseBody ?? "")
  );
}
