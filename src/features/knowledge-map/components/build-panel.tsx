"use client";

import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  buildStages,
  elapsedText,
  waitSecondsLeft,
} from "@/features/knowledge-map/domain/build-progress";
import type { BuildProgress } from "@/features/knowledge-map/schemas";
import { cn } from "@/lib/utils";

/**
 * The first build's panel in place of the map: when it started, a bar of
 * one segment per stage, the stages with the running one's count or the
 * rate limit's pause, and how many things to learn it found so far.
 */
export function BuildPanel({
  startedAt,
  progress,
  found,
}: {
  startedAt: string;
  progress: BuildProgress | null;
  /** The live KCs so far. */
  found: number;
}) {
  const now = useNow();
  const stages = buildStages(progress);
  const wait = waitSecondsLeft(progress, now);

  return (
    <section
      aria-label="Build progress"
      className="flex h-full min-h-96 w-full flex-col items-center justify-center rounded-xl border bg-card px-6 py-10"
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Building your map</h2>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            Started {elapsedText(startedAt, now)}
          </p>
        </div>
        <div aria-hidden className="flex gap-1">
          {stages.map((stage) => (
            <div
              key={stage.stage}
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${stage.fill * 100}%` }}
              />
            </div>
          ))}
        </div>
        <ol className="flex flex-col gap-3 text-sm">
          {stages.map((stage) => (
            <li
              key={stage.stage}
              aria-current={stage.state === "running" ? "step" : undefined}
              className={cn(
                "flex items-start gap-3",
                stage.state === "todo" && "text-muted-foreground",
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                {stage.state === "done" ? (
                  <CheckIcon
                    aria-label="Done"
                    className="size-4 text-primary"
                  />
                ) : stage.state === "running" ? (
                  <Spinner className="size-4" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span className="flex flex-col">
                <span
                  className={cn(stage.state === "running" && "font-medium")}
                >
                  {stage.label}
                </span>
                {stage.state === "running" && wait !== null ? (
                  <span
                    className="text-muted-foreground"
                    suppressHydrationWarning
                  >
                    Waiting for the AI, continues in {wait} s
                  </span>
                ) : (
                  stage.count && (
                    <span className="text-muted-foreground">{stage.count}</span>
                  )
                )}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            {found === 1
              ? "1 thing to learn found so far"
              : `${found} things to learn found so far`}
          </p>
          <p>You can leave this page. The build keeps running.</p>
        </div>
      </div>
    </section>
  );
}

/** The time now, ticking each second. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
