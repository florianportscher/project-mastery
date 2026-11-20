"use client";

import { useState, useTransition } from "react";
import { loadCallDetail } from "@/features/dev-inspector/server/actions";

const text = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

/** A model call's full input and output, loaded when the developer opens it. */
export function CallDetail({ callId }: { callId: string }) {
  const [shown, setShown] = useState<
    { input: string; output: string } | string | null
  >(null);
  const [pending, startTransition] = useTransition();
  if (typeof shown === "string") {
    return <span className="text-xs text-red-700">{shown}</span>;
  }
  if (shown) {
    return (
      <div className="mt-1 space-y-1">
        {(["input", "output"] as const).map((part) => (
          <details key={part} open={part === "output"}>
            <summary className="cursor-pointer text-xs text-muted-foreground">
              {part}
            </summary>
            <pre className="max-h-[32rem] overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
              {shown[part]}
            </pre>
          </details>
        ))}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="text-xs text-muted-foreground underline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await loadCallDetail({ callId });
          setShown(
            result.ok
              ? {
                  input: text(result.data.input),
                  output: text(result.data.output),
                }
              : result.message,
          );
        })
      }
    >
      {pending ? "Loading…" : "Input and output"}
    </button>
  );
}
