"use client";

import { Button } from "@/components/ui/button";

/**
 * Buttons above the input that each send a fixed message as the Student.
 * Shown after the session's first reply; hidden while a reply streams, while
 * a Question is open and once the session has ended.
 */
export function QuickReplies({
  replies,
  visible,
  questionOpen = false,
  onSend,
}: {
  replies: readonly string[];
  visible: boolean;
  /** Whether a Question is open: its parts' buttons give the help instead. */
  questionOpen?: boolean;
  onSend: (text: string) => void;
}) {
  if (!visible || questionOpen) return null;
  return (
    <div
      role="group"
      aria-label="Quick replies"
      className="flex flex-wrap gap-2"
    >
      {replies.map((text) => (
        <Button
          key={text}
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onSend(text)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}
