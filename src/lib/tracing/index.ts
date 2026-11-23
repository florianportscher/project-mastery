import { propagateAttributes } from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { appCommit } from "@/lib/app-commit";

export type TraceAttributes = {
  userId?: string;
  /** Groups traces into a session, e.g. one Chat. */
  sessionId?: string;
  traceName?: string;
  tags?: string[];
  metadata?: Record<string, string>;
};

/**
 * Applies user, session and other attributes to every span created inside
 * `fn`, including AI SDK calls, and the app commit as `appCommit` metadata.
 * A no-op when tracing is not registered.
 */
export function withTraceAttributes<T>(
  attributes: TraceAttributes,
  fn: () => T,
): T {
  return propagateAttributes(
    {
      ...attributes,
      metadata: { ...attributes.metadata, appCommit: appCommit() },
    },
    fn,
  );
}

/**
 * Exports pending spans before a serverless function freezes. Call it from
 * `after()` in every route that makes AI calls. A no-op without tracing.
 */
export async function flushTraces(): Promise<void> {
  // Duck-typed: `instanceof` breaks when bundles carry separate copies.
  const global = trace.getTracerProvider();
  const provider: object =
    "getDelegate" in global && typeof global.getDelegate === "function"
      ? global.getDelegate()
      : global;
  if ("forceFlush" in provider && typeof provider.forceFlush === "function") {
    await provider.forceFlush();
  }
}
