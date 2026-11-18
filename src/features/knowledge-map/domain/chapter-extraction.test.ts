import { describe, expect, test } from "vitest";
import { checkExtraction } from "./chapter-extraction";

describe("checkExtraction", () => {
  const kc = (
    id: string,
    chunkIds: string[],
    prerequisites: string[] = [],
  ) => ({
    id,
    name: `KC ${id}`,
    description: `About ${id}.`,
    chunkIds,
    prerequisites,
    outside: [" Limits ", "", "Sums", "Series", "Products"].map((name) => ({
      name,
      description: `About ${name.trim()}.`,
    })),
  });
  const chunks = new Map([
    ["c1", "chunk-1"],
    ["c2", "chunk-2"],
  ]);
  const known = new Map([["k1", "kc-1"]]);

  test("keeps known chunk ids, drops KCs without one, and takes Prerequisites by known or new id", () => {
    const checked = checkExtraction(
      {
        repeats: [],
        kcs: [
          kc("n1", ["c1", "c9"], ["k1", "k9"]),
          kc("n2", ["c9"]),
          kc("n3", ["c2"], ["n1", "n2", "n3", "k1"]),
        ],
      },
      chunks,
      known,
    );

    expect(checked.kcs.map((k) => [k.name, k.chunkIds])).toEqual([
      ["KC n1", ["chunk-1"]],
      ["KC n3", ["chunk-2"]],
    ]);
    expect(checked.kcs[0]!.assumes).toEqual([
      { name: "Limits", description: "About Limits." },
      { name: "Sums", description: "About Sums." },
      { name: "Series", description: "About Series." },
    ]);
    expect(checked.prerequisites).toEqual([{ from: 0, to: 1 }]);
    expect(checked.knownPrerequisites).toEqual([
      { from: "kc-1", to: 0 },
      { from: "kc-1", to: 1 },
    ]);
  });

  test("keeps a repeat of a known KC with its known chunks, and drops the others", () => {
    const checked = checkExtraction(
      {
        repeats: [
          { kcId: "k1", chunkIds: ["c1"] },
          { kcId: "k1", chunkIds: ["c2", "c9"] },
          { kcId: "k9", chunkIds: ["c1"] },
          { kcId: "k1", chunkIds: ["c9"] },
        ],
        kcs: [],
      },
      chunks,
      known,
    );

    expect(checked.repeats).toEqual([
      { kcId: "kc-1", chunkIds: ["chunk-1", "chunk-2"] },
    ]);
  });
});
