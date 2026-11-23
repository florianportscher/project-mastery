/**
 * docs/garden/ledger.json: per area the last gardened commit and its numbers,
 * and the changes the maintainer rejected, each with its area.
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
  area: string;
  change: string;
  /** The maintainer's reason, from the PR comments. */
  reason: string;
  /** Files the change touched: it is proposed again once one of them changes. */
  files: string[];
  /** When it was recorded (ISO time): a closed PR's commits are gone, so time is the boundary. */
  at: string;
  /** The closed garden PR it came from: a recorded PR is not read again. */
  pr: number;
};

/** `commit` is information only: a squash merge removes it from main. */
export type AreaEntry = { commit: string; date: string; measure: Measure };

/**
 * Rejections live beside the areas, not in them: a rejected PR's own ledger
 * update never merged, so its areas can still be ungardened.
 */
export type Ledger = { areas: Record<string, AreaEntry>; rejected: Rejected[] };

const LEDGER_FILE = "docs/garden/ledger.json";

export function readLedger(root: string): Ledger {
  const file = path.join(root, LEDGER_FILE);
  if (!existsSync(file)) return { areas: {}, rejected: [] };
  return JSON.parse(readFileSync(file, "utf8")) as Ledger;
}

export function writeLedger(root: string, ledger: Ledger) {
  const file = path.join(root, LEDGER_FILE);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`);
}

export function recordRun(
  ledger: Ledger,
  area: string,
  run: AreaEntry,
): Ledger {
  return { ...ledger, areas: { ...ledger.areas, [area]: run } };
}

export function addRejection(ledger: Ledger, rejected: Rejected): Ledger {
  return { ...ledger, rejected: [...ledger.rejected, rejected] };
}

/** PRs whose rejections the ledger holds. */
export function recordedPrs(ledger: Ledger): Set<number> {
  return new Set(ledger.rejected.map((r) => r.pr));
}

/** An area's rejected changes whose files are untouched since `at`. */
export function activeRejections(
  ledger: Ledger,
  area: string,
  changedSince: (file: string, since: string) => boolean,
): Rejected[] {
  return ledger.rejected.filter(
    (r) => r.area === area && !r.files.some((file) => changedSince(file, r.at)),
  );
}
