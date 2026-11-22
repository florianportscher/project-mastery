import { getToolName, isToolUIPart } from "ai";
import type { ChatUIMessage } from "@/features/chat/types";

/** How far a KC got today. */
type DotState = "new" | "practised" | "shown";

export type SessionStrip = {
  /** The session's Topic; null without one. */
  topic: string | null;
  /** One per KC, in order. */
  dots: Array<{ id: string; name: string; state: DotState }>;
  /** When the session started, as an ISO time. */
  startedAt: string;
  /** The length the Student chose; null for Open. */
  plannedMinutes: number | null;
};

/**
 * The strip from the newest reply's tutor context plus the KCs that reply
 * graded since: the Topic's KCs (else those worked on today) as dots, empty
 * until worked on, half once worked on and full once shown without help.
 * Null before a reply with a context.
 */
export function sessionStrip(messages: ChatUIMessage[]): SessionStrip | null {
  const reply = messages.findLast(
    ({ role, metadata }) => role === "assistant" && metadata?.tutorContext,
  );
  const context = reply?.metadata?.tutorContext;
  if (!reply || !context) return null;
  const { topic, checkedToday, startedAt, plannedMinutes } = context.session;

  const dots = new Map<string, SessionStrip["dots"][number]>();
  for (const kc of topic?.kcs ?? []) {
    dots.set(kc.id, { ...kc, state: "new" });
  }
  for (const { id, name, state } of checkedToday) {
    dots.set(id, {
      id,
      name,
      state: state === "shown" ? "shown" : "practised",
    });
  }
  for (const part of reply.parts) {
    if (
      !isToolUIPart(part) ||
      getToolName(part) !== "grade" ||
      part.state !== "output-available"
    ) {
      continue;
    }
    const help = (part.input as { help?: unknown } | undefined)?.help;
    const kcs = (part.output as { kcs?: unknown }).kcs;
    if (!Array.isArray(kcs)) continue;
    for (const kc of kcs) {
      if (typeof kc?.id !== "string") continue;
      dots.set(kc.id, {
        id: kc.id,
        name: typeof kc.name === "string" ? kc.name : kc.id,
        state: kc.result === "full" && help === "none" ? "shown" : "practised",
      });
    }
  }
  return {
    topic: topic?.name ?? null,
    dots: [...dots.values()],
    startedAt,
    plannedMinutes,
  };
}

/** Such as "12 of 30 min", or "12 min" for an Open session. */
export const minutesText = (used: number, planned: number | null) =>
  planned === null ? `${used} min` : `${used} of ${planned} min`;

/** A dot's accessible name, such as "Limits: practised". */
export const dotLabel = (dot: SessionStrip["dots"][number]) =>
  `${dot.name}: ${
    dot.state === "new"
      ? "not yet"
      : dot.state === "practised"
        ? "practised"
        : "shown on your own"
  }`;
