import { describe, expect, test } from "vitest";
import {
  planTopicTree,
  storedAsProposed,
  topicLineage,
  type ProposedTopic,
} from "./topic-tree";

const proposed = (
  level: number,
  name: string,
  kcIds: string[],
  continues: string | null = null,
): ProposedTopic => ({
  level,
  name,
  kcIds,
  centralQuestion: kcIds.length > 0 ? `Why ${name}?` : "",
  continues,
});

const kcs = (...ids: string[]) =>
  ids.map((id) => ({ id, material: id.startsWith("s") ? "Sheet" : "Script" }));

const plan = (
  topics: ProposedTopic[],
  ids: string[],
  stored: Array<{ id: string; kcs: string[] }> = [],
) => planTopicTree({ proposed: topics, kcs: kcs(...ids), stored });

describe("planTopicTree", () => {
  test("nests Topics by level, deeper levels becoming level 2", () => {
    const tree = plan(
      [
        proposed(1, "Spaces", []),
        proposed(2, "Subspaces", ["k1"]),
        proposed(3, "Bases", ["k2"]),
        proposed(1, "Maps", ["k3"]),
      ],
      ["k1", "k2", "k3"],
    );
    expect(
      tree.map((t) => [t.name, t.parent, t.kcs, t.centralQuestion]),
    ).toEqual([
      ["Spaces", null, [], null],
      ["Subspaces", 0, ["k1"], "Why Subspaces?"],
      ["Bases", 0, ["k2"], "Why Bases?"],
      ["Maps", null, ["k3"], "Why Maps?"],
    ]);
  });

  test("gives a KC to the first Topic naming it, and one no Topic names to its neighbour's Topic", () => {
    const tree = plan(
      [proposed(1, "A", ["k2"]), proposed(1, "B", ["k2", "k4", "gone"])],
      // k1 comes first: it follows the KC after it; k3 and k5 the one before.
      ["k1", "k2", "k3", "k4", "k5"],
    );
    expect(tree.map((t) => [t.name, t.kcs])).toEqual([
      ["A", ["k1", "k2", "k3"]],
      ["B", ["k4", "k5"]],
    ]);
  });

  test("drops Topics without KCs or children, from the leaves up", () => {
    const tree = plan(
      [
        proposed(1, "Empty parent", []),
        proposed(2, "Empty child", ["gone"]),
        proposed(1, "Holder", []),
        proposed(2, "Spaces", ["k1"]),
      ],
      ["k1"],
    );
    expect(tree.map((t) => [t.name, t.parent])).toEqual([
      ["Holder", null],
      ["Spaces", 0],
    ]);
  });

  test("makes a Topic per Material when no Topic names a KC", () => {
    const tree = plan([], ["k1", "s1", "k2"]);
    expect(tree.map((t) => [t.name, t.kcs, t.centralQuestion])).toEqual([
      ["Script", ["k1", "k2"], "Script"],
      ["Sheet", ["s1"], "Sheet"],
    ]);
  });

  test("keeps a continued stored id once, then continues a stored Topic by the free Topic sharing most KCs", () => {
    const tree = plan(
      [
        proposed(1, "A", ["k1"], "t1"),
        proposed(1, "B", ["k2"], "t1"),
        proposed(1, "C", ["k3", "k4"], "unknown"),
      ],
      ["k1", "k2", "k3", "k4"],
      [
        { id: "t1", kcs: ["k1"] },
        { id: "t2", kcs: ["k2", "k3"] },
        { id: "t3", kcs: ["k3", "k4"] },
      ],
    );
    // B shares k2 with t2 and comes before C, which shares as many.
    expect(tree.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });

  test("a stored tree proposed again plans the same Topics", () => {
    const stored = [
      {
        id: "t1",
        parentId: null,
        name: "Spaces",
        centralQuestion: null,
        kcs: [],
      },
      {
        id: "t2",
        parentId: "t1",
        name: "Bases",
        centralQuestion: "Why?",
        kcs: ["k1"],
      },
    ];
    const tree = plan(storedAsProposed(stored), ["k1"], stored);
    expect(tree.map((t) => [t.id, t.parent, t.centralQuestion])).toEqual([
      ["t1", null, null],
      ["t2", 0, "Why?"],
    ]);
  });
});

test("a Topic's lineage runs from it up to the top", () => {
  const parents = new Map([
    ["leaf", "mid"],
    ["mid", "top"],
    ["top", null],
  ]);
  expect(topicLineage("leaf", parents)).toEqual(["leaf", "mid", "top"]);
  expect(topicLineage("top", parents)).toEqual(["top"]);
});
