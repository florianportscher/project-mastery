import type { DevUnit, Flags, Snapshot } from "@/features/dev-inspector/types";

/** The key of one page of a Material, as anchors and flags name it. */
export const pageKey = (materialId: string, pageNumber: number) =>
  `${materialId}-${pageNumber}`;

/** Skip reasons of a page that was read but gave no unit. */
const UNREAD = new Set(["unreadable", "uncovered"]);

/**
 * The suspect spots of a build, computed from the snapshot and its stored
 * check report. Near-duplicates come from the report's pairs: the view does
 * no vector math. `coverageBar` is the build's MIN_UNIT_COVERAGE.
 */
export function buildFlags(
  snapshot: Snapshot,
  units: readonly DevUnit[],
  coverageBar: number,
): Flags {
  const live = snapshot.kcs.filter((kc) => kc.retiredAt === null);
  const cited = new Set(live.flatMap((kc) => kc.sources));
  const report = readReport(snapshot.build?.checkReport);
  return {
    chaptersWithoutKcs: chaptersWithoutKcs(snapshot, cited),
    chaptersInReport: chaptersInReport(snapshot, report),
    kcsWithoutSources: new Set(
      live.filter((kc) => kc.sources.length === 0).map((kc) => kc.id),
    ),
    nearDuplicates: nearDuplicates(live, report.duplicates),
    unitsBelowCoverage: new Map(
      units.flatMap((unit) => {
        if (unit.kind !== "content") return [];
        const coverage = unitCoverage(snapshot, unit, cited);
        return coverage < coverageBar ? [[unit.key, coverage] as const] : [];
      }),
    ),
    unreadPages: new Set(
      snapshot.pages
        .filter((page) => page.skipped !== null && UNREAD.has(page.skipped))
        .map((page) => pageKey(page.materialId, page.pageNumber)),
    ),
  };
}

/**
 * The share of a unit's characters in chunks some live KC cites, from 0 to
 * 1; 1 for a unit without characters.
 */
export function unitCoverage(
  snapshot: Pick<Snapshot, "chunks">,
  unit: Pick<DevUnit, "chunkIds">,
  cited: ReadonlySet<string>,
): number {
  const ids = new Set(unit.chunkIds);
  const chunks = snapshot.chunks.filter((chunk) => ids.has(chunk.id));
  const total = chunks.reduce((sum, chunk) => sum + chunk.chars, 0);
  if (total === 0) return 1;
  const covered = chunks.reduce(
    (sum, chunk) => sum + (cited.has(chunk.id) ? chunk.chars : 0),
    0,
  );
  return covered / total;
}

/**
 * Chapters outside old exams with `content` chunks of their own that no
 * live KC cites, as the build's check report counts them.
 */
function chaptersWithoutKcs(
  snapshot: Snapshot,
  cited: ReadonlySet<string>,
): Set<string> {
  const parentOf = new Map(snapshot.chapters.map((c) => [c.id, c.parentId]));
  const examOf = new Map(
    snapshot.chapters.map((c) => [c.id, c.isExam === true]),
  );
  const inExam = (id: string | null, seen = 0): boolean =>
    id !== null &&
    seen < snapshot.chapters.length &&
    (examOf.get(id) === true || inExam(parentOf.get(id) ?? null, seen + 1));
  const teaching = new Set<string>();
  const citedChapters = new Set<string>();
  for (const chunk of snapshot.chunks) {
    if (chunk.chapterId === null) continue;
    if (chunk.label === "content") teaching.add(chunk.chapterId);
    if (cited.has(chunk.id)) citedChapters.add(chunk.chapterId);
  }
  return new Set(
    [...teaching].filter((id) => !citedChapters.has(id) && !inExam(id)),
  );
}

type Report = {
  chaptersWithoutKcs: string[];
  unitsBelowCoverage: string[];
  unitsNotExtracted: string[];
  duplicates: Array<{ a: string; b: string }>;
};

/** The parts of a stored check report the flags read; missing parts empty. */
function readReport(value: unknown): Report {
  const report = (value ?? {}) as Record<string, unknown>;
  const list = (key: string): unknown[] =>
    Array.isArray(report[key]) ? report[key] : [];
  const strings = (key: string) =>
    list(key).filter((item): item is string => typeof item === "string");
  return {
    chaptersWithoutKcs: strings("chaptersWithoutKcs"),
    unitsNotExtracted: strings("unitsNotExtracted"),
    unitsBelowCoverage: list("unitsBelowCoverage").flatMap((item) => {
      const chapter = (item as { chapter?: unknown } | null)?.chapter;
      return typeof chapter === "string" ? [chapter] : [];
    }),
    duplicates: list("duplicates").flatMap((item) => {
      const { a, b } = (item ?? {}) as { a?: unknown; b?: unknown };
      return typeof a === "string" && typeof b === "string" ? [{ a, b }] : [];
    }),
  };
}

/**
 * Chapters the check report names, with what it says of each. A unit is
 * named by its Chapters' titles joined with ", ", so each title counts.
 */
function chaptersInReport(
  snapshot: Snapshot,
  report: Report,
): Map<string, string[]> {
  const notes = new Map<string, string[]>();
  const mark = (entries: string[], note: string) => {
    for (const chapter of snapshot.chapters) {
      const named = entries.some(
        (entry) =>
          entry === chapter.title || entry.split(", ").includes(chapter.title),
      );
      if (named)
        notes.set(chapter.id, [...(notes.get(chapter.id) ?? []), note]);
    }
  };
  mark(report.chaptersWithoutKcs, "without KCs");
  mark(report.unitsBelowCoverage, "unit below coverage");
  mark(report.unitsNotExtracted, "unit not extracted");
  return notes;
}

/** Live KCs of the report's alike pairs, matched by name, with partners. */
function nearDuplicates(
  live: Snapshot["kcs"],
  pairs: Report["duplicates"],
): Map<string, string[]> {
  const idsOf = Map.groupBy(live, (kc) => kc.name);
  const partners = new Map<string, string[]>();
  const add = (from: string, to: string) =>
    partners.set(from, [...(partners.get(from) ?? []), to]);
  for (const { a, b } of pairs) {
    for (const kcA of idsOf.get(a) ?? []) {
      for (const kcB of idsOf.get(b) ?? []) {
        if (kcA.id === kcB.id) continue;
        add(kcA.id, kcB.id);
        add(kcB.id, kcA.id);
      }
    }
  }
  return partners;
}
