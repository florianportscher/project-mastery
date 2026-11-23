import { describe, expect, test } from "vitest";
import { buildFlags, pageKey } from "@/features/dev-inspector/domain/flags";
import type {
  DevUnit,
  Snapshot,
  SnapshotChunk,
  SnapshotKc,
} from "@/features/dev-inspector/types";

const chunk = (id: string, chars = 10, label = "content"): SnapshotChunk => ({
  id,
  materialId: "m",
  heading: null,
  position: 0,
  label,
  pageFrom: 1,
  pageTo: 1,
  chars,
});
const kc = (
  id: string,
  sources: string[],
  name = id,
  retiredAt: string | null = null,
): SnapshotKc => ({
  id,
  name,
  description: "",
  origin: "content",
  position: 0,
  assumes: [],
  retiredAt,
  sources,
});
const unit = (key: string, chunkIds: string[], title = key): DevUnit => ({
  key,
  kind: "content",
  materialId: "m",
  batch: 0,
  title,
  chunkIds,
  extraction: null,
  promptCurrent: false,
});

const built = (checkReport: unknown): Snapshot["build"] => ({
  status: "built",
  failureReason: null,
  startedAt: "",
  finishedAt: null,
  heartbeatAt: "",
  needsUpdate: false,
  appCommit: null,
  checkReport,
});

const snapshot = (parts: Partial<Snapshot>): Snapshot => ({
  course: { id: "c", name: "Course", language: null },
  materials: [],
  pages: [],
  chunks: [],
  extractions: [],
  kcs: [],
  prerequisites: [],
  exercises: [],
  exams: [],
  exerciseKcs: [],
  topics: [],
  build: null,
  ...parts,
});

describe("buildFlags", () => {
  test("marks content chunks no live KC cites", () => {
    const flags = buildFlags(
      snapshot({
        chunks: [chunk("a1"), chunk("b1"), chunk("x1", 10, "exercise")],
        kcs: [kc("k1", ["a1"]), kc("k2", ["b1"], "Ring", "2026-01-01")],
      }),
      [],
      0.5,
    );
    expect([...flags.chunksWithoutKcs]).toEqual(["b1"]);
  });

  test("marks live KCs without sources and the report's alike pairs both ways", () => {
    const flags = buildFlags(
      snapshot({
        kcs: [
          kc("k1", ["c1"], "Vector"),
          kc("k2", ["c2"], "Vectors"),
          kc("k3", []),
          kc("k4", [], "old", "2026-01-01"),
        ],
        build: built({
          duplicates: [{ a: "Vector", b: "Vectors", similarity: 0.9 }],
        }),
      }),
      [],
      0.5,
    );
    expect([...flags.kcsWithoutSources]).toEqual(["k3"]);
    expect(Object.fromEntries(flags.nearDuplicates)).toEqual({
      k1: ["k2"],
      k2: ["k1"],
    });
  });

  test("marks teaching units below the bar by the characters live KCs cite", () => {
    const flags = buildFlags(
      snapshot({
        chunks: [chunk("c1", 30), chunk("c2", 70), chunk("c3")],
        kcs: [kc("k1", ["c1"]), kc("k2", ["c3"])],
      }),
      [unit("low", ["c1", "c2"]), unit("full", ["c3"])],
      0.5,
    );
    expect(Object.fromEntries(flags.unitsBelowCoverage)).toEqual({ low: 0.3 });
  });

  test("marks unread pages and the units the check report names", () => {
    const flags = buildFlags(
      snapshot({
        pages: [
          {
            materialId: "m",
            pageNumber: 1,
            skipped: null,
            labels: ["content"],
          },
          { materialId: "m", pageNumber: 2, skipped: "uncovered", labels: [] },
          { materialId: "m", pageNumber: 3, skipped: "blank", labels: [] },
        ],
        build: built({
          unitsBelowCoverage: [{ unit: "Script p. 1–4", coverage: 0.2 }],
          unitsNotExtracted: ["Script p. 1–4", "Script p. 5"],
        }),
      }),
      [unit("a", [], "Script p. 1–4"), unit("b", [], "Script p. 5")],
      0.5,
    );
    expect([...flags.unreadPages]).toEqual([pageKey("m", 2)]);
    expect(Object.fromEntries(flags.unitsInReport)).toEqual({
      a: ["unit below coverage", "unit not extracted"],
      b: ["unit not extracted"],
    });
  });
});
