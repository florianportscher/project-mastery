import { describe, expect, test } from "vitest";
import { buildFlags, pageKey } from "@/features/dev-inspector/domain/flags";
import type {
  DevUnit,
  Snapshot,
  SnapshotChapter,
  SnapshotChunk,
  SnapshotKc,
} from "@/features/dev-inspector/types";

const chapter = (
  id: string,
  title: string,
  parentId: string | null = "root",
): SnapshotChapter => ({
  id,
  materialId: "m",
  parentId,
  depth: parentId ? 1 : 0,
  position: 0,
  title,
  pageFrom: 1,
});
const chunk = (
  id: string,
  chapterId: string,
  chars = 10,
  label = "content",
): SnapshotChunk => ({
  id,
  materialId: "m",
  chapterId,
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
const unit = (key: string, chunkIds: string[]): DevUnit => ({
  key,
  kind: "content",
  materialId: "m",
  chapterId: "a",
  unit: 0,
  chapterIds: ["a"],
  chunkIds,
  extraction: null,
});

const snapshot = (parts: Partial<Snapshot>): Snapshot => ({
  course: { id: "c", name: "Course", language: null },
  materials: [],
  pages: [],
  chapters: [],
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
  test("marks Chapters whose content no live KC cites", () => {
    const flags = buildFlags(
      snapshot({
        chapters: [
          chapter("root", "Script", null),
          chapter("a", "Groups"),
          chapter("b", "Rings"),
        ],
        chunks: [
          chunk("a1", "a"),
          chunk("b1", "b"),
          chunk("x1", "root", 10, "exercise"),
        ],
        kcs: [kc("k1", ["a1"]), kc("k2", ["b1"], "Ring", "2026-01-01")],
      }),
      [],
      0.5,
    );
    expect([...flags.chaptersWithoutKcs]).toEqual(["b"]);
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
        build: {
          status: "built",
          failureReason: null,
          startedAt: "",
          finishedAt: null,
          heartbeatAt: "",
          needsUpdate: false,
          checkReport: {
            duplicates: [{ a: "Vector", b: "Vectors", similarity: 0.9 }],
          },
        },
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
        chunks: [chunk("c1", "a", 30), chunk("c2", "a", 70), chunk("c3", "a")],
        kcs: [kc("k1", ["c1"]), kc("k2", ["c3"])],
      }),
      [unit("low", ["c1", "c2"]), unit("full", ["c3"])],
      0.5,
    );
    expect(Object.fromEntries(flags.unitsBelowCoverage)).toEqual({ low: 0.3 });
  });

  test("marks unread pages and the Chapters the check report names", () => {
    const flags = buildFlags(
      snapshot({
        chapters: [chapter("a", "Groups"), chapter("b", "Rings")],
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
        build: {
          status: "built",
          failureReason: null,
          startedAt: "",
          finishedAt: null,
          heartbeatAt: "",
          needsUpdate: false,
          checkReport: {
            chaptersWithoutKcs: ["Rings"],
            unitsBelowCoverage: [{ chapter: "Groups, Rings", coverage: 0.2 }],
          },
        },
      }),
      [],
      0.5,
    );
    expect([...flags.unreadPages]).toEqual([pageKey("m", 2)]);
    expect(Object.fromEntries(flags.chaptersInReport)).toEqual({
      a: ["unit below coverage"],
      b: ["without KCs", "unit below coverage"],
    });
  });
});
