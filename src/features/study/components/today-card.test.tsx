import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { NextItem } from "@/features/study/types";
import { TodayCard } from "./today-card";

const queueMockExam = vi.fn();
vi.mock("@/features/study/server/actions", () => ({
  queueMockExam: (input: unknown) => queueMockExam(input),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const review = (id: string): NextItem => ({
  kind: "review",
  id,
  name: `KC ${id}`,
  centralQuestion: null,
});
const topic: NextItem = {
  kind: "topic",
  id: "t1",
  name: "Nozzles",
  centralQuestion: "How does a nozzle speed up its gas?",
};

type CardState = Parameters<typeof TodayCard>[0]["state"];

const renderCard = (
  state: Partial<CardState> = {},
  mock?: { courseId: string; openHref: string | null },
) =>
  render(
    <TodayCard
      state={{
        hasMap: true,
        hasTopics: true,
        ranking: [],
        finalStretch: false,
        taught: false,
        lastMinutes: null,
        ...state,
      }}
      mapHref="/courses/c1/map"
      topicHref={(id) => `/courses/c1/map/${id}`}
      chatHref="/courses/c1/chat"
      mock={mock}
    />,
  );

const card = () => screen.getByRole("region", { name: "Today" });
const buttons = () =>
  within(card())
    .queryAllByRole("link")
    .filter((link) => link.getAttribute("href")?.includes("?say="))
    .map((link) => [link.textContent, link.getAttribute("href")]);

test("shows the due Reviews, then the next Topic with its link, without minutes", () => {
  renderCard({ ranking: [review("k1"), review("k2"), topic], taught: true });

  expect(card()).toHaveTextContent("2 reviews due");
  expect(card()).not.toHaveTextContent("about");
  expect(within(card()).getByRole("link", { name: "Nozzles" })).toHaveAttribute(
    "href",
    "/courses/c1/map/t1",
  );
  expect(card()).toHaveTextContent("Next Topic");
  expect(card()).toHaveTextContent("How does a nozzle speed up its gas?");
  expect(buttons()).toEqual([
    ["Let's start.", "/courses/c1/chat?say=Let's%20start.&minutes=30"],
    ["Let's review.", "/courses/c1/chat?say=Let's%20review.&minutes=30"],
    [
      "Exam problems please.",
      "/courses/c1/chat?say=Exam%20problems%20please.&minutes=30",
    ],
  ]);
});

test("preselects the last session's length, and the buttons carry the chosen one, none for Open", () => {
  renderCard({ ranking: [topic], lastMinutes: 45 });
  const length = (name: string) => screen.getByRole("radio", { name });
  expect(length("45 min")).toBeChecked();
  expect(buttons()[0]![1]).toContain("&minutes=45");

  fireEvent.click(length("15 min"));
  expect(length("15 min")).toBeChecked();
  expect(buttons()[0]![1]).toContain("&minutes=15");

  fireEvent.click(length("Open"));
  expect(buttons()[0]![1]).toBe("/courses/c1/chat?say=Let's%20start.");
});

test("offers only Let's start. before anything is taught or due", () => {
  renderCard({ ranking: [topic] });
  expect(buttons().map(([text]) => text)).toEqual(["Let's start."]);
});

test("lists the first 5 items in the final stretch", () => {
  renderCard({
    finalStretch: true,
    ranking: [topic, ...["a", "b", "c", "d", "e"].map(review)],
  });
  const items = within(card()).getAllByRole("listitem");
  expect(items).toHaveLength(5);
  expect(items[0]).toHaveTextContent("TopicNozzles");
  expect(items[1]).toHaveTextContent("ReviewKC a");
});

test("says so with nothing left in the ranking, keeping Exam problems please.", () => {
  renderCard({ taught: true });
  expect(card()).toHaveTextContent("Nothing left to study right now.");
  expect(buttons().map(([text]) => text)).toEqual(["Exam problems please."]);
});

test.each([
  [{ hasMap: false }, "Build your Course map"],
  [{ hasTopics: false }, "Update your Course map"],
])(
  "without a map or Topics links to build or update it (%o)",
  (state, text) => {
    renderCard({ ...state, ranking: [topic] });
    expect(within(card()).getByRole("link", { name: text })).toHaveAttribute(
      "href",
      "/courses/c1/map",
    );
    expect(buttons()).toEqual([]);
  },
);

test("offers Mock exam once a KC is taught, which assembles one and opens its page", async () => {
  queueMockExam.mockResolvedValue({ ok: true, data: { mockId: "m1" } });
  renderCard(
    { ranking: [topic], taught: true },
    {
      courseId: "c1",
      openHref: null,
    },
  );

  fireEvent.click(screen.getByRole("button", { name: "Mock exam" }));

  await waitFor(() => expect(push).toHaveBeenCalledWith("/courses/c1/mock/m1"));
  expect(queueMockExam).toHaveBeenCalledWith({ courseId: "c1" });
});

test("offers no Mock exam before a KC is taught, but Continue mock exam while one is open", () => {
  const { unmount } = renderCard(
    { ranking: [topic] },
    {
      courseId: "c1",
      openHref: null,
    },
  );
  expect(screen.queryByRole("button", { name: "Mock exam" })).toBeNull();
  unmount();

  renderCard(
    { ranking: [topic] },
    {
      courseId: "c1",
      openHref: "/courses/c1/mock/m1",
    },
  );
  expect(
    screen.getByRole("link", { name: "Continue mock exam" }),
  ).toHaveAttribute("href", "/courses/c1/mock/m1");
});
