import { describe, expect, it } from "vitest";
import {
  changeOf,
  isGardenCommit,
  parseLog,
  pickAreas,
  sinceLastGarden,
} from "./pick";

const log = [
  "@aaa\tfeat(study): ask more",
  "10\t2\tsrc/features/study/a.ts",
  "5\t5\tsrc/features/study/a.test.ts",
  "@bbb\trefactor(garden): inline b",
  "100\t100\tsrc/features/study/b.ts",
  "@ccc\tfix: image",
  "-\t-\tsrc/features/study/logo.png",
  "3\t0\tsrc/lib/database.types.ts",
].join("\n");

describe("changeOf", () => {
  const commits = parseLog(log);

  it("counts lines of code, leaving out tests and garden commits", () => {
    expect(changeOf("study", commits, false, 500)).toEqual({
      name: "study",
      lines: 12,
      commits: 2,
      neverGardened: false,
    });
  });

  it("counts an area never gardened as all of its code", () => {
    expect(changeOf("study", commits, true, 500).lines).toBe(500);
  });

  it("recognises garden commits by scope", () => {
    expect(isGardenCommit("docs(garden): ledger")).toBe(true);
    expect(isGardenCommit("fix: garden")).toBe(false);
  });
});

describe("sinceLastGarden", () => {
  // main after a squash merge: the garden branch's commits are gone, one
  // commit with the garden scope stands in their place.
  const main = parseLog(
    [
      "@d4\tfeat(study): newest",
      "4\t0\tsrc/features/study/a.ts",
      "@d3\trefactor(garden): garden 2026-11-23 (#401)",
      "9\t9\tsrc/features/study/a.ts",
      "@d2\tfix(study): older",
      "1\t1\tsrc/features/study/a.ts",
    ].join("\n"),
  );

  it("starts after the newest garden commit on main", () => {
    const since = sinceLastGarden(main);
    expect(since.neverGardened).toBe(false);
    expect(since.commits.map((c) => c.sha)).toEqual(["d4"]);
  });

  it("counts every commit when no garden commit exists", () => {
    const since = sinceLastGarden(main.slice(2));
    expect(since).toEqual({ commits: main.slice(2), neverGardened: true });
  });
});

describe("pickAreas", () => {
  const stat = (name: string, lines: number) => ({
    name,
    lines,
    commits: 1,
    neverGardened: false,
  });

  it("takes the N areas with the most change and skips unchanged ones", () => {
    const picked = pickAreas(
      [stat("lib", 5), stat("app", 0), stat("study", 90), stat("chat", 40)],
      3,
    );
    expect(picked.map((s) => s.name)).toEqual(["study", "chat", "lib"]);
  });
});
