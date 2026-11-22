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
  chunks: [
    {
      id: "k1",
      materialId: "m1",
      heading: "Limits",
      position: 0,
      label: "content",
      pageFrom: 1,
      pageTo: 1,
      chars: 10,
    },
    {
      id: "k2",
      materialId: "m1",
      heading: "Series",
      position: 1,
      label: "content",
      pageFrom: 2,
      pageTo: 2,
      chars: 10,
    },
  ],
  extractions: [
    { materialId: "m1", kind: "content", batch: 0, kcIds: ["kc1"] },
  ],
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
    expect(lines.join("\n")).toMatch(/content chunk without KCs: Series p2-2/);
    expect(lines.join("\n")).toMatch(/KC without sources: Orphan/);
    expect(lines.join("\n")).toMatch(/unread pages: m1:3/);
    expect(lines.join("\n")).toMatch(/failed call: a/);
  });

  it("prints a unit with its KCs", () => {
    expect(formatSection("units", snapshot, null)).toContain(
      "m1/content/0 Notes content 0: Limit",
    );
  });

  it("prints each Material's chunks under their headings", () => {
    expect(formatSection("chunks", snapshot, null)).toBe(
      "# Notes\nLimits\n  - content p1-1 10 chars (k1)\nSeries\n  - content p2-2 10 chars (k2)",
    );
  });

  it("refuses a bad course id and an unknown section", async () => {
    await expect(inspect(["nope"])).rejects.toThrow(AgentError);
    await expect(
      inspect(["00000000-0000-0000-0000-000000000000", "bogus"]),
    ).rejects.toThrow(AgentError);
  });
});
