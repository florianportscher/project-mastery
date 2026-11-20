import "server-only";
import { LangfuseClient } from "@langfuse/client";
import { getTracingEnvironment, isLangfuseConfigured } from "./env";

/**
 * One traced model call as Langfuse stores it (`GET
 * /api/public/v2/observations`). Trace metadata set with
 * `withTraceAttributes` lands in `metadata` under its own key; the trace
 * name under `attributes.langfuse.trace.name`
 * (docs/agents/notes/langfuse.md).
 */
export type TracedCall = {
  id: string;
  /** The trace name, such as `extract-chapter`. */
  name: string;
  model: string | null;
  startTime: string;
  endTime: string | null;
  /** `ERROR` for a failed call. */
  level: string;
  statusMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  /** In USD; null when Langfuse knows no price. */
  cost: number | null;
  /** The call's string metadata, such as `courseId`. */
  metadata: Record<string, string>;
};

/** A traced call with what it sent and answered. */
export type TracedCallDetail = TracedCall & { input: unknown; output: unknown };

/** A list of traced calls; `truncated` when older calls were left out. */
export type TracedCalls = { calls: TracedCall[]; truncated: boolean };

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const LIST_FIELDS = "core,basic,usage,model,metadata";

type Observation = Awaited<
  ReturnType<LangfuseClient["api"]["observations"]["getMany"]>
>["data"][number];

/**
 * The calls of this deployment's tracing environment whose trace metadata
 * `key` is `value`, oldest first, without input or output. Null when no
 * Langfuse keys are set. At most MAX_PAGES pages of PAGE_SIZE calls, the
 * newest ones.
 *
 * Tool spans are left out, and so is an `embedMany` span that wraps the
 * embedding span of its provider call, so each model call is listed once.
 */
export async function listTracedCalls(
  key: string,
  value: string,
): Promise<TracedCalls | null> {
  if (!isLangfuseConfigured()) return null;
  const client = new LangfuseClient();
  const filter = JSON.stringify([
    {
      type: "stringOptions",
      column: "environment",
      operator: "any of",
      value: [getTracingEnvironment()],
    },
    {
      type: "stringOptions",
      column: "type",
      operator: "any of",
      value: ["GENERATION", "EMBEDDING"],
    },
    { type: "stringObject", column: "metadata", key, operator: "=", value },
  ]);
  const observations: Observation[] = [];
  let cursor: string | undefined;
  let truncated = false;
  for (let page = 0; ; page++) {
    if (page === MAX_PAGES) {
      truncated = true;
      break;
    }
    const response = await client.api.observations.getMany({
      fields: LIST_FIELDS,
      limit: PAGE_SIZE,
      filter,
      ...(cursor && { cursor }),
    });
    observations.push(...response.data);
    cursor = response.meta.cursor ?? undefined;
    if (!cursor || response.data.length < PAGE_SIZE) break;
  }
  const parents = new Set(
    observations.map((observation) => observation.parentObservationId),
  );
  const calls = observations
    .filter((observation) => !parents.has(observation.id))
    .map(toCall)
    .toSorted((a, b) => a.startTime.localeCompare(b.startTime));
  return { calls, truncated };
}

/** One call with its input and output; null when unknown or no keys are set. */
export async function getTracedCall(
  id: string,
): Promise<TracedCallDetail | null> {
  if (!isLangfuseConfigured()) return null;
  const response = await new LangfuseClient().api.observations.getMany({
    fields: `${LIST_FIELDS},io`,
    limit: 1,
    filter: JSON.stringify([
      { type: "string", column: "id", operator: "=", value: id },
    ]),
  });
  const observation = response.data[0];
  if (!observation) return null;
  return {
    ...toCall(observation),
    input: observation.input,
    output: observation.output,
  };
}

function toCall(observation: Observation): TracedCall {
  const raw = observation.metadata ?? {};
  const metadata = Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  return {
    id: observation.id,
    name: metadata["attributes.langfuse.trace.name"] ?? observation.name ?? "",
    model: observation.model ?? null,
    startTime: observation.startTime,
    endTime: observation.endTime,
    level: observation.level ?? "DEFAULT",
    statusMessage: observation.statusMessage || null,
    inputTokens: observation.usageDetails?.input ?? 0,
    outputTokens: observation.usageDetails?.output ?? 0,
    cost: observation.totalCost ?? null,
    metadata,
  };
}
