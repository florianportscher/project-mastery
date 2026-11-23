import { expect, it } from "vitest";
import type { Area } from "./areas";
import { cycles, moduleOf, parseComplexity, renderMap } from "./map";
import type { ParsedFile } from "./metrics";

const study: Area = { name: "study", paths: ["src/features/study"] };
const lib: Area = { name: "lib", paths: ["src/lib"] };

const file = (loc: number, imports: ParsedFile["imports"] = []) => ({
  loc,
  exports: [],
  imports,
});

it("names a module by its first folder, or by the file at the top", () => {
  expect(moduleOf(study, "src/features/study/ai/tools.ts")).toBe("ai/");
  expect(moduleOf(study, "src/features/study/types.ts")).toBe("types.ts");
});

it("finds rings of imports and leaves out chains", () => {
  const edges = new Map([
    ["a", new Set(["b"])],
    ["b", new Set(["a", "c"])],
    ["c", new Set<string>()],
  ]);
  expect(cycles(edges)).toEqual([["a", "b"]]);
});

it("reads function names and scores from ESLint's complexity messages", () => {
  const json = JSON.stringify([
    {
      filePath: "/repo/src/a.ts",
      messages: [
        {
          ruleId: "complexity",
          line: 3,
          message:
            "Async function 'grade' has a complexity of 13. Maximum allowed is 10.",
        },
        {
          ruleId: "complexity",
          line: 9,
          message:
            "Arrow function has a complexity of 11. Maximum allowed is 10.",
        },
        { ruleId: "no-console", line: 1, message: "Unexpected console." },
      ],
    },
  ]);
  expect(parseComplexity(json, (abs) => abs.replace("/repo/", ""))).toEqual([
    { file: "src/a.ts", line: 3, name: "grade", score: 13 },
    { file: "src/a.ts", line: 9, name: "Arrow function", score: 11 },
  ]);
});

it("shows module imports, outside importers, cycles and files by change", () => {
  const parsed = new Map<string, ParsedFile>([
    [
      "src/features/study/server/a.ts",
      file(10, [
        { target: "src/features/study/workflows/b.ts", names: ["runB"] },
        { target: "src/lib/db.ts", names: ["db"] },
      ]),
    ],
    [
      "src/features/study/workflows/b.ts",
      file(20, [
        { target: "src/features/study/server/a.ts", names: ["loadA"] },
      ]),
    ],
    [
      "src/lib/db.ts",
      file(5, [{ target: "src/features/study/server/a.ts", names: ["loadA"] }]),
    ],
  ]);
  const map = renderMap({
    area: study,
    areas: [study, lib],
    parsed,
    changed: { "src/features/study/workflows/b.ts": 40 },
    complex: [
      {
        file: "src/features/study/workflows/b.ts",
        line: 7,
        name: "runB",
        score: 12,
      },
    ],
  });
  expect(map).toContain("# study: 2 files, 30 loc, 40 lines changed");
  expect(map).toContain("server/ -> workflows/: runB");
  expect(map).toContain("server/ -> lib: db");
  expect(map).toContain("lib -> server/: loadA");
  expect(map).toContain("modules: server/ <-> workflows/");
  expect(map).toContain(
    "src/features/study/workflows/b.ts  20 loc  40 changed  in 1/0  runB:7 12",
  );
  expect(map.indexOf("workflows/b.ts  20 loc")).toBeLessThan(
    map.indexOf("server/a.ts  10 loc"),
  );
});
