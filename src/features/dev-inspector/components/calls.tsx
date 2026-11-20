import { CallDetail } from "@/features/dev-inspector/components/call-detail";
import {
  Flag,
  Ref,
  Row,
} from "@/features/dev-inspector/components/inspector-parts";
import type { CallFlags } from "@/features/dev-inspector/domain/calls";
import { anchor, type Lookup } from "@/features/dev-inspector/domain/lookup";
import type { DevCall, DevCalls } from "@/features/dev-inspector/types";

const seconds = (call: DevCall) =>
  call.endTime
    ? `${((Date.parse(call.endTime) - Date.parse(call.startTime)) / 1000).toFixed(1)} s`
    : "–";

/** Links to calls by name and time, failed and retried ones marked. */
export function CallRefs({
  calls,
  flags,
}: {
  calls: DevCall[];
  flags: CallFlags;
}) {
  if (calls.length === 0)
    return <span className="text-muted-foreground">–</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-2">
      {calls.map((call) => (
        <Ref key={call.id} to={anchor.call(call.id)}>
          {call.name} {new Date(call.startTime).toLocaleTimeString("en")}
          {flags.failed.has(call.id) && " ⚑ failed"}
          {flags.retried.has(call.id) && " ⚑ retried"}
        </Ref>
      ))}
    </span>
  );
}

/** Every traced parse and build call of the Course, in time order. */
export function CallList({
  calls,
  flags,
  lookup,
}: {
  calls: DevCalls;
  flags: CallFlags;
  lookup: Lookup;
}) {
  if (calls.status === "untraced") {
    return (
      <p className="text-sm text-muted-foreground">
        No calls traced: no Langfuse keys are set.
      </p>
    );
  }
  if (calls.status === "error") {
    return <Flag>Langfuse did not answer: {calls.message}</Flag>;
  }
  if (calls.calls.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No calls traced for this Course. Calls made before they carried its id
        are not found.
      </p>
    );
  }
  const list = calls.calls;
  const cost = list.reduce((sum, call) => sum + (call.cost ?? 0), 0);
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        {list.length} calls · {flags.failed.size} failed · {flags.retried.size}{" "}
        retried · {list.reduce((sum, c) => sum + c.inputTokens, 0)} in /{" "}
        {list.reduce((sum, c) => sum + c.outputTokens, 0)} out tokens · $
        {cost.toFixed(4)}
      </p>
      {list.map((call) => (
        <div
          key={call.id}
          id={anchor.call(call.id)}
          className="scroll-mt-4 rounded border p-1.5 text-sm target:border-yellow-500"
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium">{call.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(call.startTime).toLocaleString("en")} · {seconds(call)}{" "}
              · {call.inputTokens} in / {call.outputTokens} out
              {call.cost !== null && ` · $${call.cost.toFixed(4)}`}
              {call.model && ` · ${call.model}`}
            </span>
            {flags.failed.has(call.id) && <Flag>failed</Flag>}
            {flags.retried.has(call.id) && <Flag>retried</Flag>}
          </div>
          {call.statusMessage && (
            <p className="text-xs text-red-800 dark:text-red-200">
              {call.statusMessage}
            </p>
          )}
          {call.materialId && (
            <Row label="Material">
              <Ref to={anchor.material(call.materialId)}>
                {lookup.material.get(call.materialId)?.name ?? call.materialId}
              </Ref>
            </Row>
          )}
          {call.unitKey && (
            <Row label="Unit">
              <Ref to={anchor.unit(call.unitKey)}>{call.unitKey}</Ref>
            </Row>
          )}
          <CallDetail callId={call.id} />
        </div>
      ))}
    </div>
  );
}
