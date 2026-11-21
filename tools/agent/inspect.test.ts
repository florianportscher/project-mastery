import { describe, expect, it } from "vitest";
import { AgentError } from "./config";
import { flagLines, formatSection, inspect, type Snapshot } from "./inspect";

const snapshot: Snapshot = {
  course: { id: "c", name: "Course" },
  materials: [
    {
      id: "m1",
      name: "Notes",
      parseStatus: "done",
      parseFailure: null,
      pagesTotal: 4,
    },
  ],
  pages: [{ materialId: "m1", pageNumber: 3, skipped: "unreadable" }],
  chapters: [
    {
      id: "ch1",
      materialId: "m1",
      parentId: null,
      depth: 0,
      position: 0,
      title: "Limits",
      pageFrom: 1,
    },
    {
      id: "ch2",
      materialId: "m1",
      parentId: null,
      depth: 0,
      position: 1,
      title: "Series",
      pageFrom: 2,
    },
  ],
  chunks: [
    {
      id: "k1",
      chapterId: "ch1",
      position: 0,
      label: "content",
      pageFrom: 1,
      pageTo: 1,
      chars: 10,
    },
    {
      id: "k2",
      chapterId: "ch2",
      position: 0,
      label: "content",
      pageFrom: 2,
      pageTo: 2,
      chars: 10,
    },
  ],
  extractions: [{ chapterId: "ch1", kind: "content", unit: 0, kcIds: ["kc1"] }],
  kcs: [
    {
      id: "kc1",
      name: "Limit",
      origin: "extracted",
      assumes: [],
      retiredAt: null,
      sources: ["k1"],
    },
    {
      id: "kc2",
      name: "Orphan",
      origin: "extracted",
      assumes: [],
      retiredAt: null,
      sources: [],
    },
  ],
  prerequisites: [],
  exercises: [],
  exams: [],
  exerciseKcs: [],
  topics: [],
  build: null,
};

describe("agent inspect", () => {
  it("flags the suspect spots", () => {
    const lines = flagLines(snapshot, [
      {
        id: "a",
        name: "extract-chapter",
        model: null,
        startTime: "t1",
        endTime: null,
        level: "ERROR",
        statusMessage: "boom",
        inputTokens: 0,
        outputTokens: 0,
        cost: null,
        metadata: {},
      },
    ]);
    expect(lines.join("\n")).toMatch(/chapter without KCs: Series/);
    expect(lines.join("\n")).toMatch(/KC without sources: Orphan/);
    expect(lines.join("\n")).toMatch(/unread pages: m1:3/);
    expect(lines.join("\n")).toMatch(/failed call: a/);
  });

  it("prints a unit with its KCs", () => {
    expect(formatSection("units", snapshot, null)).toContain(
      "Limits content: Limit",
    );
  });

  it("refuses a bad course id and an unknown section", async () => {
    await expect(inspect(["nope"])).rejects.toThrow(AgentError);
    await expect(
      inspect(["00000000-0000-0000-0000-000000000000", "bogus"]),
    ).rejects.toThrow(AgentError);
  });
});
