import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, expect, it } from "vitest";
import {
  activeRejections,
  readLedger,
  recordRun,
  writeLedger,
  type Measure,
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

it("keeps an area's rejected changes when a run is recorded", () => {
  const rejected = {
    change: "inline x",
    reason: "x is a seam",
    files: ["src/lib/x.ts"],
    at: "abc",
  };
  const first = {
    areas: { lib: { commit: "abc", date: "d", measure, rejected: [rejected] } },
  };
  writeLedger(root, first);
  const next = recordRun(readLedger(root), "lib", {
    commit: "def",
    date: "e",
    measure,
  });
  expect(next.areas.lib).toMatchObject({ commit: "def", rejected: [rejected] });
});

it("proposes a rejected change again once its code changed", () => {
  const entry = {
    commit: "abc",
    date: "d",
    measure,
    rejected: [
      { change: "a", reason: "r", files: ["a.ts"], at: "abc" },
      { change: "b", reason: "r", files: ["b.ts"], at: "abc" },
    ],
  };
  const active = activeRejections(entry, (file) => file === "b.ts");
  expect(active.map((r) => r.change)).toEqual(["a"]);
});

it("writes the numbers before and after into the report skeleton", () => {
  const text = reportSkeleton("2026-11-23", [
    { name: "lib", before: measure, after: { ...measure, loc: 7 } },
  ]);
  expect(text).toContain("| lib | 1 -> 1 | 10 -> 7 |");
});
