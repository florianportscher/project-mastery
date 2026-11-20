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

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const LIST_FIELDS = "core,basic,usage,model,metadata";

type Observation = Awaited<
  ReturnType<LangfuseClient["api"]["observations"]["getMany"]>
>["data"][number];

/**
 * The calls of this deployment's tracing environment whose trace metadata
 * `key` is `value`, oldest first, without input or output. Null when no
 * Langfuse keys are set. At most MAX_PAGES pages of PAGE_SIZE calls.
 */
export async function listTracedCalls(
  key: string,
  value: string,
): Promise<TracedCall[] | null> {
  if (!isLangfuseConfigured()) return null;
  const client = new LangfuseClient();
  const filter = JSON.stringify([
    {
      type: "stringOptions",
      column: "environment",
      operator: "any of",
      value: [getTracingEnvironment()],
    },
    { type: "stringObject", column: "metadata", key, operator: "=", value },
  ]);
  const calls: TracedCall[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await client.api.observations.getMany({
      fields: LIST_FIELDS,
      limit: PAGE_SIZE,
      filter,
      ...(cursor && { cursor }),
    });
    calls.push(...response.data.map(toCall));
    cursor = response.meta.cursor ?? undefined;
    if (!cursor || response.data.length < PAGE_SIZE) break;
  }
  return calls.toSorted((a, b) => a.startTime.localeCompare(b.startTime));
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
