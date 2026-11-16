import { expect, test } from "vitest";
import type { ChatUIMessage } from "@/features/chat/types";
import type { TutorContext } from "@/features/study";
import { dotLabel, minutesText, sessionStrip } from "./session-strip";

const context = (
  checkedToday: Array<{ id: string; state: "shown" | "worked" }>,
  topicKcs: string[] | null,
) =>
  ({
    session: {
      startedAt: "2026-11-07T09:48:00Z",
      plannedMinutes: 30,
      checkedToday: checkedToday.map((kc) => ({ ...kc, name: kc.id })),
      topic: topicKcs && {
        id: "t",
        name: "Limits",
        kcs: topicKcs.map((id) => ({ id, name: id })),
      },
    },
  }) as unknown as TutorContext;

const reply = (
  tutorContext: TutorContext,
  graded: Array<{ id: string; result: string }> = [],
  help = "none",
) =>
  ({
    id: "r",
    role: "assistant",
    metadata: { tutorContext },
    parts: [
      {
        type: "tool-grade",
        toolCallId: "g",
        state: "output-available",
        input: { help },
        output: {
          kcs: graded.map((kc) => ({ ...kc, name: kc.id })),
          check: null,
        },
      },
    ],
  }) as ChatUIMessage;

test("draws the Topic's KCs, empty until worked on, with the newest reply's grades", () => {
  const strip = sessionStrip([
    reply(context([], ["a", "b", "c"])),
    reply(
      context([{ id: "a", state: "shown" }], ["a", "b", "c"]),
      [
        { id: "b", result: "full" },
        { id: "c", result: "full" },
      ],
      "some",
    ),
  ]);
  expect(strip?.topic).toBe("Limits");
  expect(strip?.dots.map(({ id, state }) => [id, state])).toEqual([
    ["a", "shown"],
    ["b", "practised"],
    ["c", "practised"],
  ]);
});

test("a full without help shows a KC", () => {
  const strip = sessionStrip([
    reply(context([], ["a"]), [{ id: "a", result: "full" }]),
  ]);
  expect(strip?.dots[0]?.state).toBe("shown");
});

test("without a Topic, the dots are the KCs worked on today", () => {
  const strip = sessionStrip([
    reply(context([{ id: "x", state: "worked" }], null)),
  ]);
  expect(strip?.topic).toBeNull();
  expect(strip?.dots.map(({ id, state }) => [id, state])).toEqual([
    ["x", "practised"],
  ]);
});

test("is null before a reply with a context", () => {
  expect(
    sessionStrip([{ id: "s", role: "user", parts: [] } as ChatUIMessage]),
  ).toBeNull();
});

test("words the time and a dot", () => {
  expect(minutesText(12, 30)).toBe("12 of 30 min");
  expect(minutesText(12, null)).toBe("12 min");
  expect(dotLabel({ id: "a", name: "Limits", state: "new" })).toBe(
    "Limits: not yet",
  );
});
