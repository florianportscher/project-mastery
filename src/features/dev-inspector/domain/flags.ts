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
    chunksWithoutKcs: new Set(
      snapshot.chunks
        .filter((chunk) => chunk.label === "content" && !cited.has(chunk.id))
        .map((chunk) => chunk.id),
    ),
    unitsInReport: unitsInReport(units, report),
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

type Report = {
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
    unitsNotExtracted: strings("unitsNotExtracted"),
    unitsBelowCoverage: list("unitsBelowCoverage").flatMap((item) => {
      const unit = (item as { unit?: unknown } | null)?.unit;
      return typeof unit === "string" ? [unit] : [];
    }),
    duplicates: list("duplicates").flatMap((item) => {
      const { a, b } = (item ?? {}) as { a?: unknown; b?: unknown };
      return typeof a === "string" && typeof b === "string" ? [{ a, b }] : [];
    }),
  };
}

/** Units the check report names by title, with what it says of each. */
function unitsInReport(
  units: readonly DevUnit[],
  report: Report,
): Map<string, string[]> {
  const notes = new Map<string, string[]>();
  const mark = (entries: string[], note: string) => {
    for (const unit of units) {
      if (entries.includes(unit.title)) {
        notes.set(unit.key, [...(notes.get(unit.key) ?? []), note]);
      }
    }
  };
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
