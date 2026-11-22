"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SESSION_LENGTHS } from "@/features/study/domain/today-messages";

const DEFAULT_MINUTES = 30;

/**
 * The Today card's way into a new Chat: the length of the session (15, 30
 * or 45 minutes, or Open) and one button per first message. Each button
 * links to `chatHref` with `?say=` and, unless Open, `&minutes=`.
 */
export function StartButtons({
  messages,
  chatHref,
  lastMinutes,
}: {
  messages: string[];
  chatHref: string;
  lastMinutes: number | null;
}) {
  const [minutes, setMinutes] = useState<number | null>(
    lastMinutes ?? DEFAULT_MINUTES,
  );
  const href = (text: string) =>
    `${chatHref}?say=${encodeURIComponent(text)}${minutes === null ? "" : `&minutes=${minutes}`}`;
  return (
    <>
      <div
        role="radiogroup"
        aria-label="Session length"
        className="flex flex-wrap gap-1"
      >
        {[...SESSION_LENGTHS, null].map((length) => (
          <Button
            key={length ?? "open"}
            type="button"
            role="radio"
            aria-checked={minutes === length}
            size="sm"
            variant={minutes === length ? "secondary" : "ghost"}
            onClick={() => setMinutes(length)}
          >
            {length === null ? "Open" : `${length} min`}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {messages.map((text, index) => (
          <Button
            key={text}
            asChild
            size="sm"
            variant={index === 0 ? "default" : "outline"}
          >
            <Link href={href(text)}>{text}</Link>
          </Button>
        ))}
      </div>
    </>
  );
}
