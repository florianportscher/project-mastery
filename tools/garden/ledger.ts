/**
 * docs/garden/ledger.json: per area the last gardened commit, its numbers and
 * the changes the maintainer rejected.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SizeMetrics } from "./metrics";

export type Measure = SizeMetrics & {
  knip: number;
  clones: number;
  /** Functions over the ESLint complexity threshold. */
  complex: number;
  tests: number;
  /** Line coverage in percent, null when the area has no covered code. */
  coverage: number | null;
};

export type Rejected = {
  change: string;
  /** The maintainer's reason, from the PR comments. */
  reason: string;
  /** Files the change touched: it is proposed again once one of them changes. */
  files: string[];
  /** Commit the rejection was recorded at. */
  at: string;
};

export type AreaEntry = {
  commit: string;
  date: string;
  measure: Measure;
  rejected: Rejected[];
};

export type Ledger = { areas: Record<string, AreaEntry> };

const LEDGER_FILE = "docs/garden/ledger.json";

export function readLedger(root: string): Ledger {
  const file = path.join(root, LEDGER_FILE);
  if (!existsSync(file)) return { areas: {} };
  return JSON.parse(readFileSync(file, "utf8")) as Ledger;
}

export function writeLedger(root: string, ledger: Ledger) {
  const file = path.join(root, LEDGER_FILE);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`);
}

/** A run's result for one area; its rejected changes carry over. */
export function recordRun(
  ledger: Ledger,
  area: string,
  run: { commit: string; date: string; measure: Measure },
): Ledger {
  const rejected = ledger.areas[area]?.rejected ?? [];
  return { areas: { ...ledger.areas, [area]: { ...run, rejected } } };
}

/** Rejected changes whose files are untouched since `at`. */
export function activeRejections(
  entry: AreaEntry | undefined,
  changedSince: (file: string, sha: string) => boolean,
): Rejected[] {
  return (entry?.rejected ?? []).filter(
    (r) => !r.files.some((file) => changedSince(file, r.at)),
  );
}
