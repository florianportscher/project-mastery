import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import type { BuildProgress } from "@/features/knowledge-map/schemas";
import type {
  KnowledgeMapView,
  MapTopic,
} from "@/features/knowledge-map/types";
import { ProgressLine } from "@/features/study";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
// The study feature's index also exports its Memory card's server action.
vi.mock("server-only", () => ({}));
vi.mock("@/features/knowledge-map/server/actions", () => ({
  startKnowledgeMapBuild: vi.fn(),
}));
// The page lays the graph out in a web worker; here the same ELK runs
// in-process.
vi.mock("@/features/knowledge-map/hooks/use-graph-layout", async () => {
  const { useEffect, useState } = await import("react");
  const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
  const elk = new ELK();
  return {
    useGraphLayout(graph: object) {
      const [laidOut, setLaidOut] = useState<object | null>(null);
      useEffect(() => {
        // ELK can finish after the test ends, when jsdom is gone. Ignore a
        // result that arrives once the component has unmounted.
        let mounted = true;
        void elk.layout(graph as never).then((result) => {
          if (mounted) setLaidOut(result);
        });
        return () => {
          mounted = false;
        };
      }, [graph]);
      return { laidOut, failed: false };
    },
  };
});

// Vitest globals are off, so Testing Library does not unmount after each test.
afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // What React Flow reads, which jsdom lacks.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const { CourseMap } = await import("./course-map");

const kc = (id: string) => ({
  id,
  name: id,
  description: "",
  origin: "content" as const,
  sources: [],
});

const map: KnowledgeMapView = {
  courseId: "c1",
  build: {
    status: "built",
    failureReason: null,
    finishedAt: "2026-10-20T10:00:00Z",
    startedAt: "2026-10-20T09:50:00Z",
    progress: { stage: "finishing" },
  },
  kcs: [kc("k1"), kc("k2")],
  prerequisites: [{ from: "k1", to: "k2" }],
  exercises: [],
  checkReport: null,
  canBuild: true,
  needsUpdate: false,
};

const topics: MapTopic[] = [
  {
    id: "t1",
    parentId: null,
    name: "Momentum",
    centralQuestion: "Why does a rocket move forward?",
    kcs: [{ id: "k1", name: "k1" }],
  },
  {
    id: "t2",
    parentId: "t1",
    name: "Nozzles",
    centralQuestion: "How does a nozzle speed up its gas?",
    kcs: [{ id: "k2", name: "k2" }],
  },
];

const plan: ComponentProps<typeof ProgressLine>["state"] = {
  examDate: "2026-12-03",
  progress: { learned: 34, total: 120, daysIn: 12, daysLeft: 30 },
};

const renderMap = (
  view: KnowledgeMapView,
  mapTopics: MapTopic[],
  progressPlan = plan,
) =>
  render(
    <CourseMap
      map={view}
      topics={mapTopics}
      topicStudies={{ t1: { learned: 1, total: 3, readiness: 0.624 } }}
      topicBadges={{ t2: ["pinned"] }}
      progressLine={<ProgressLine state={progressPlan} briefHref="/brief" />}
      readinessLine={<p>Readiness line</p>}
    />,
  );

test("a card shows its plan badges", async () => {
  renderMap(map, topics);
  const card = await screen.findByRole("link", { name: "Nozzles" });
  expect(within(card).getByLabelText("Plan")).toHaveTextContent("pinned");
  const other = screen.getByRole("link", { name: "Momentum" });
  expect(within(other).queryByLabelText("Plan")).toBeNull();
});

test("each Topic is a card opening its Topic page", async () => {
  renderMap(map, topics);
  const graph = await screen.findByRole("application", {
    name: "Course map graph",
  });
  const card = await within(graph).findByRole("link", { name: "Momentum" });
  expect(card).toHaveTextContent("Why does a rocket move forward?");
  expect(card).toHaveAttribute("href", "/courses/c1/map/t1");
  // Momentum holds Nozzles: a box around its own card and Nozzles'.
  expect(within(graph).getByRole("group", { name: "Momentum" })).toBeVisible();
  expect(within(graph).getByRole("link", { name: "Nozzles" })).toBeVisible();
  // The KC graph is gone.
  expect(screen.queryByRole("button", { name: "k1" })).toBeNull();
});

test("each card shows how many of its KCs are learned", async () => {
  renderMap(map, topics);
  const card = await screen.findByRole("link", { name: "Momentum" });
  expect(card).toHaveTextContent("1 of 3 learned");
  expect(screen.getByRole("link", { name: "Nozzles" })).not.toHaveTextContent(
    "learned",
  );
});

test("the header shows the Readiness line and a card its Readiness", async () => {
  renderMap(map, topics);
  expect(screen.getByText("Readiness line")).toBeVisible();
  const card = await screen.findByRole("link", { name: "Momentum" });
  expect(card).toHaveTextContent("Readiness 62%");
  expect(screen.getByRole("link", { name: "Nozzles" })).not.toHaveTextContent(
    "Readiness",
  );
});

test("a map whose update stopped before its Topics asks for an update", () => {
  renderMap(map, []);
  expect(
    screen.getByRole("heading", { name: "Update map to finish your Topics" }),
  ).toBeVisible();
  expect(screen.getAllByRole("button", { name: "Update map" })).toHaveLength(2);
  expect(screen.queryByRole("application")).toBeNull();
});

describe("the map check", () => {
  const weak = {
    ...map,
    checkReport: {
      uncitedPages: [{ material: "Notes", pages: [1, 2] }],
      exercisesWithoutKcs: [],
      duplicates: [],
      unitsBelowCoverage: [{ unit: "Notes p. 3–9", coverage: 0.3 }],
      unreadPages: [{ material: "Notes", pages: [10, 36, 37, 38] }],
      unitsNotExtracted: [],
      exercisesNotGrouped: false,
    },
  };
  const renderCheck = (view: KnowledgeMapView, checkDetails: boolean) =>
    render(
      <CourseMap
        map={view}
        topics={[]}
        topicStudies={{}}
        topicBadges={{}}
        progressLine={null}
        checkDetails={checkDetails}
      />,
    );

  test("tells the Student in one line what the AI missed, with Update map", () => {
    renderCheck(weak, false);
    const note = screen.getByRole("note", { name: "Map check" });
    expect(note).toHaveTextContent(
      "The AI couldn't read pp. 10, 36–38 and covered Notes p. 3–9 only in part.",
    );
    expect(
      within(note).getByRole("button", { name: "Update map" }),
    ).toBeVisible();
    expect(within(note).queryByText("Check report")).toBeNull();
  });

  test("shows the full lists outside production", () => {
    renderCheck(weak, true);
    const note = screen.getByRole("note", { name: "Map check" });
    expect(note).toHaveTextContent("Pages without KCs");
    expect(note).toHaveTextContent("Notes pp. 1–2");
    expect(note).toHaveTextContent("Notes p. 3–9: 30%");
  });

  test("says nothing of a full build to the Student", () => {
    renderCheck(
      {
        ...weak,
        checkReport: {
          ...weak.checkReport,
          unitsBelowCoverage: [],
          unreadPages: [],
        },
      },
      false,
    );
    expect(screen.queryByRole("note", { name: "Map check" })).toBeNull();
  });
});

test("a map whose Materials or old exams changed since its build asks for Update map", () => {
  renderMap({ ...map, needsUpdate: true }, topics);
  const note = screen.getByRole("note", { name: "Map update" });
  expect(note).toHaveTextContent("Your Materials changed");
  expect(
    within(note).getByRole("button", { name: "Update map" }),
  ).toBeVisible();
});

test("without a map, the page says so", () => {
  renderMap({ ...map, build: null, kcs: [] }, []);
  expect(screen.getByRole("heading", { name: "No map yet" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Build knowledge map" }),
  ).toBeVisible();
});

describe("the first build's panel", () => {
  const firstBuild = (
    progress: BuildProgress | null,
    kcs: KnowledgeMapView["kcs"] = [],
  ) =>
    renderMap(
      {
        ...map,
        kcs,
        build: {
          status: "building",
          failureReason: null,
          finishedAt: null,
          startedAt: new Date(Date.now() - 150_000).toISOString(),
          progress,
        },
      },
      [],
    );
  const stages = () =>
    within(screen.getByRole("region", { name: "Build progress" }))
      .getAllByRole("listitem")
      .map((item) => item.textContent);

  test("starts reading the Materials before a step recorded progress", () => {
    firstBuild(null);
    expect(
      screen.getByRole("heading", { name: "Building your map" }),
    ).toBeVisible();
    expect(screen.getByText("Started 2 min ago")).toBeVisible();
    expect(stages()[0]).toBe("Reading your Materials");
    expect(screen.getByText("0 things to learn found so far")).toBeVisible();
    expect(screen.queryByText("Building…")).toBeNull();
  });

  test("marks the stages done before the running one, with its count", () => {
    firstBuild({ stage: "exercises", done: 2, total: 5 }, [kc("k1"), kc("k2")]);
    expect(stages()).toEqual([
      "Reading your Materials",
      "Working through your Exercises2 of 5 batches",
      "Connecting what builds on what",
      "Grouping into Topics",
      "Finishing",
    ]);
    expect(screen.getAllByLabelText("Done")).toHaveLength(1);
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Working through your Exercises",
    );
    expect(screen.getByText("2 things to learn found so far")).toBeVisible();
  });

  test("tells how long the rate limit pauses the build", () => {
    firstBuild({
      stage: "materials",
      done: 4,
      total: 12,
      waitUntil: new Date(Date.now() + 39_500).toISOString(),
    });
    expect(stages()[0]).toBe(
      "Reading your MaterialsWaiting for the AI, continues in 40 s",
    );
  });
});

describe("an Update map and a failed build", () => {
  const build = (over: Partial<NonNullable<KnowledgeMapView["build"]>>) => ({
    status: "building" as const,
    failureReason: null,
    finishedAt: "2026-01-01T10:00:00Z",
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    progress: null,
    ...over,
  });

  test("an update keeps the map and shows the stage under the title", () => {
    renderMap(
      {
        ...map,
        build: build({ progress: { stage: "materials", done: 3, total: 4 } }),
      },
      topics,
    );
    const status = screen.getByRole("status", { name: "Build status" });
    expect(status).toHaveTextContent(
      "Reading your Materials · 3 of 4 sections",
    );
    expect(
      within(status).getByRole("progressbar", { name: "Update progress" }),
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: "Build progress" })).toBeNull();
  });

  test("a failed first build keeps the panel, marks the stage and offers Try again", () => {
    renderMap(
      {
        ...map,
        kcs: [],
        build: build({
          status: "failed",
          failureReason: "The AI stopped answering.",
          finishedAt: null,
          progress: { stage: "topics" },
        }),
      },
      [],
    );
    const panel = screen.getByRole("region", { name: "Build progress" });
    expect(panel).toHaveTextContent("The AI stopped answering.");
    expect(within(panel).getByLabelText("Stopped here")).toBeVisible();
    expect(
      within(panel).getByRole("button", { name: "Try again" }),
    ).toBeVisible();
  });

  test("a failed update keeps the map and shows the reason with Try again", () => {
    renderMap(
      {
        ...map,
        build: build({
          status: "failed",
          failureReason: "The AI stopped answering.",
        }),
      },
      topics,
    );
    const status = screen.getByRole("status", { name: "Build status" });
    expect(status).toHaveTextContent("The AI stopped answering.");
    expect(
      within(status).getByRole("button", { name: "Try again" }),
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: "Build progress" })).toBeNull();
  });
});

describe("the Progress line", () => {
  test("shows the bar and the line", () => {
    renderMap(map, topics);
    const bar = screen.getByRole("progressbar", { name: "Progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "34");
    expect(bar).toHaveAttribute("aria-valuemax", "120");
    expect(
      screen.getByText("34 of 120 KCs learned · 12 days in · 30 days left"),
    ).toBeVisible();
    expect(screen.queryByRole("link", { name: /exam date/ })).toBeNull();
    expect(screen.getByText("Readiness line")).toBeVisible();
  });

  test("leaves out the days it lacks and links to the Brief without a date", () => {
    renderMap(map, topics, {
      examDate: null,
      progress: { learned: 0, total: 1, daysIn: null, daysLeft: null },
    });
    expect(screen.getByText("0 of 1 KC learned")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Add your exam date in the Brief" }),
    ).toHaveAttribute("href", "/brief");
  });

  test("reads Exam today on the exam day", () => {
    renderMap(map, topics, {
      ...plan,
      progress: { ...plan.progress, daysIn: 1, daysLeft: 0 },
    });
    expect(
      screen.getByText("34 of 120 KCs learned · 1 day in · Exam today"),
    ).toBeVisible();
  });

  test("shows nothing without in-plan KCs", () => {
    renderMap(map, topics, {
      examDate: null,
      progress: { learned: 0, total: 0, daysIn: 3, daysLeft: null },
    });
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("link", { name: /exam date/ })).toBeNull();
  });
});
