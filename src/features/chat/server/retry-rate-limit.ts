import "server-only";
import { gatewayRateLimitWaitMs } from "@/lib/ai/rate-limit";

/** Stream parts that come before a reply has any content. */
const PREAMBLE = new Set(["start", "start-step"]);

/**
 * The parts of a reply's stream, where a call that fails on the Gateway's
 * per-minute limit before the reply has text or a tool call is waited out
 * (the time the error names, at most 60 s) and started again once. A second
 * failure, and a reply that already streamed, fail as they are.
 */
export function retryRateLimited<Part extends { type: string }>(
  startReply: () => Promise<ReadableStream<Part>>,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
): ReadableStream<Part> {
  let reader: ReadableStreamDefaultReader<Part> | undefined;
  let retried = false;
  let buffered: Part[] = [];
  let open = false;

  return new ReadableStream<Part>({
    async pull(controller) {
      reader ??= (await startReply()).getReader();
      while (true) {
        if (buffered.length > 0 && open) {
          controller.enqueue(buffered.shift()!);
          return;
        }
        const { done, value } = await reader.read();
        if (done) {
          for (const part of buffered) controller.enqueue(part);
          controller.close();
          return;
        }
        if (open) {
          controller.enqueue(value);
          return;
        }
        if (PREAMBLE.has(value.type)) {
          buffered.push(value);
          continue;
        }
        const waitMs =
          value.type === "error" && !retried
            ? gatewayRateLimitWaitMs((value as { error?: unknown }).error)
            : null;
        if (waitMs !== null) {
          retried = true;
          buffered = [];
          await reader.cancel().catch(() => {});
          await wait(Math.min(waitMs, 60_000));
          reader = (await startReply()).getReader();
          continue;
        }
        // The reply has content or fails for good: pass it all on.
        open = true;
        buffered.push(value);
      }
    },
    cancel: (reason) => reader?.cancel(reason),
  });
}
