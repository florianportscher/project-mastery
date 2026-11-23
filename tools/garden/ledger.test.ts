import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, expect, it } from "vitest";
import {
  activeRejections,
  addRejection,
  readLedger,
  recordedPrs,
  recordRun,
  writeLedger,
  type Measure,
  type Rejected,
} from "./ledger";
import { reportSkeleton } from "./report";

const root = mkdtempSync(path.join(os.tmpdir(), "garden-ledger-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const measure: Measure = {
  files: 1,
  loc: 10,
  exports: 2,
  usedOutside: 1,
  knip: 0,
  clones: 0,
  complex: 0,
  tests: 3,
  coverage: null,
};

const rejection = (change: string, files: string[]): Rejected => ({
  area: "lib",
  change,
  reason: "x is a seam",
  files,
  at: "abc",
  pr: 7,
});

it("records a rejection for an area that was never gardened and keeps it across runs", () => {
  writeLedger(
    root,
    addRejection(readLedger(root), rejection("inline x", ["src/lib/x.ts"])),
  );
  const next = recordRun(readLedger(root), "lib", {
    commit: "def",
    date: "e",
    measure,
  });
  expect(next.areas.lib).toMatchObject({ commit: "def" });
  expect(next.rejected.map((r) => r.change)).toEqual(["inline x"]);
  expect(recordedPrs(next)).toEqual(new Set([7]));
});

it("proposes a rejected change again once its code changed", () => {
  const ledger = {
    areas: {},
    rejected: [
      rejection("a", ["a.ts"]),
      rejection("b", ["b.ts"]),
      { ...rejection("c", ["c.ts"]), area: "tools" },
    ],
  };
  const active = activeRejections(ledger, "lib", (file) => file === "b.ts");
  expect(active.map((r) => r.change)).toEqual(["a"]);
});

it("writes the numbers before and after into the report skeleton", () => {
  const text = reportSkeleton("2026-11-23", [
    { name: "lib", before: measure, after: { ...measure, loc: 7 } },
  ]);
  expect(text).toContain("| lib | 1 -> 1 | 10 -> 7 |");
});
