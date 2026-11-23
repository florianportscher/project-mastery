import { expect, it } from "vitest";
import type { Area } from "./areas";
import { countClones, countKnip } from "./measure";

const areas: Area[] = [
  { name: "lib", paths: ["src/lib"] },
  { name: "app", paths: ["src/app"] },
];

it("counts every knip finding under the area of its file", () => {
  const json = JSON.stringify({
    issues: [
      { file: "src/lib/a.ts", exports: [{}, {}], types: [{}], files: [] },
      { file: "src/app/b.ts", files: [{}] },
      { file: "package.json", dependencies: [{}] },
    ],
  });
  expect(countKnip(json, areas)).toEqual({ lib: 3, app: 1 });
});

it("counts a clone once for each area it lies in", () => {
  const json = JSON.stringify({
    duplicates: [
      {
        firstFile: { name: "src/lib/a.ts" },
        secondFile: { name: "src/lib/b.ts" },
      },
      {
        firstFile: { name: "src/lib/a.ts" },
        secondFile: { name: "src/app/c.ts" },
      },
    ],
  });
  expect(countClones(json, areas)).toEqual({ lib: 2, app: 1 });
});
