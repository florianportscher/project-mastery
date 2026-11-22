"use client";

import { useEffect, useState } from "react";
import {
  dotLabel,
  minutesText,
  type SessionStrip as Strip,
} from "@/features/chat/domain/session-strip";
import { cn } from "@/lib/utils";

const MINUTE_MS = 60_000;

const minutesSince = (startedAt: string) =>
  Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / MINUTE_MS));

/**
 * The strip above a Chat's messages: the session's Topic, one dot per KC
 * (empty, half once worked on, full once shown without help) and the
 * minutes used, counted in the browser from the session's start and kept
 * counting past the chosen length.
 */
export function SessionStrip({ strip }: { strip: Strip }) {
  const { startedAt, plannedMinutes } = strip;
  const [used, setUsed] = useState(() => minutesSince(startedAt));
  useEffect(() => {
    const tick = () => setUsed(minutesSince(startedAt));
    tick();
    const timer = setInterval(tick, MINUTE_MS);
    return () => clearInterval(timer);
  }, [startedAt]);

  return (
    <div
      data-testid="session-strip"
      className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground"
    >
      {strip.topic !== null && (
        <span className="truncate font-medium text-foreground">
          {strip.topic}
        </span>
      )}
      {strip.dots.length > 0 && (
        <ul className="flex shrink-0 items-center gap-1">
          {strip.dots.map((dot) => (
            <li
              key={dot.id}
              role="img"
              aria-label={dotLabel(dot)}
              title={dotLabel(dot)}
              className={cn(
                "size-2.5 rounded-full border border-foreground/60",
                dot.state === "practised" &&
                  "bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)] text-foreground/60",
                dot.state === "shown" && "bg-foreground/60",
              )}
            />
          ))}
        </ul>
      )}
      <span className="shrink-0">{minutesText(used, plannedMinutes)}</span>
    </div>
  );
}
