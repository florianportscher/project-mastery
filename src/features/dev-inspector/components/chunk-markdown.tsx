"use client";

import { useState, useTransition } from "react";
import { loadChunkMarkdown } from "@/features/dev-inspector/server/actions";

/** A chunk's Markdown, loaded when the developer opens it. */
export function ChunkMarkdown({ chunkId }: { chunkId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (text !== null) {
    return (
      <pre className="mt-1 max-h-96 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
        {text}
      </pre>
    );
  }
  return (
    <button
      type="button"
      className="text-xs text-muted-foreground underline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await loadChunkMarkdown({ chunkId });
          setText(result.ok ? result.data : result.message);
        })
      }
    >
      {pending ? "Loading…" : "Markdown"}
    </button>
  );
}
