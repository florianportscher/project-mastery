import { APICallError, RetryError } from "ai";
import { describe, expect, test } from "vitest";
import { gatewayRateLimitWaitMs, isDailyQuotaError } from "@/lib/ai/rate-limit";

const rateLimit = (message: string) =>
  Object.assign(new Error(message), { name: "GatewayRateLimitError" });

describe("gatewayRateLimitWaitMs", () => {
  test("reads the wait the message names", () => {
    expect(
      gatewayRateLimitWaitMs(rateLimit("Too many. Retry after 20s.")),
    ).toBe(20_000);
  });

  test("waits a minute when the message names none", () => {
    expect(gatewayRateLimitWaitMs(rateLimit("Too many."))).toBe(60_000);
  });

  test("finds the error inside the AI SDK's retry error", () => {
    const error = new RetryError({
      message: "Failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [rateLimit("Retry after 5s.")],
    });
    expect(gatewayRateLimitWaitMs(error)).toBe(5000);
  });

  test("is null for another error", () => {
    expect(gatewayRateLimitWaitMs(new Error("boom"))).toBeNull();
  });
});

/** A 429 from the Gemini API for the quota `quotaId` (see docs/agents/live-ai.md). */
function quota429(quotaId: string) {
  return new APICallError({
    message: "You exceeded your current quota",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode: 429,
    responseBody: JSON.stringify({
      error: {
        code: 429,
        status: "RESOURCE_EXHAUSTED",
        details: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [{ quotaId, quotaValue: "20" }],
          },
        ],
      },
    }),
  });
}

describe("isDailyQuotaError", () => {
  test("is true for a 429 of the requests-per-day quota", () => {
    expect(
      isDailyQuotaError(
        quota429("GenerateRequestsPerDayPerProjectPerModel-FreeTier"),
      ),
    ).toBe(true);
  });

  test("is true for that 429 after the SDK's retries", () => {
    const daily = quota429("GenerateRequestsPerDayPerProjectPerModel-FreeTier");
    const retried = new RetryError({
      message: "Failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [daily, daily],
    });

    expect(isDailyQuotaError(retried)).toBe(true);
  });

  test("is false for a per-minute 429, which waiting clears", () => {
    expect(
      isDailyQuotaError(
        quota429("GenerateRequestsPerMinutePerProjectPerModel-FreeTier"),
      ),
    ).toBe(false);
  });

  test("is false for other errors", () => {
    expect(isDailyQuotaError(new Error("bad output"))).toBe(false);
  });

  test("is false for a 500 whose body says daily", () => {
    const error = new APICallError({
      message: "Internal error",
      url: "https://example.test",
      requestBodyValues: {},
      statusCode: 500,
      responseBody: "daily maintenance",
    });
    expect(isDailyQuotaError(error)).toBe(false);
  });

  test("is false for a 429 without a body", () => {
    const error = new APICallError({
      message: "Too many requests",
      url: "https://example.test",
      requestBodyValues: {},
      statusCode: 429,
    });
    expect(isDailyQuotaError(error)).toBe(false);
  });

  test("is false for a plain error that carries a 429 status", () => {
    const error = Object.assign(new Error("Requests per day exceeded"), {
      statusCode: 429,
      responseBody: "daily",
    });
    expect(isDailyQuotaError(error)).toBe(false);
  });
});
