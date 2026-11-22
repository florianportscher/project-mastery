import { describe, expect, test } from "vitest";
import { teachingBatches, unitHash } from "./teaching-batches";

const chunk = (id: string, heading: string | null, chars = 10) => ({
  id,
  heading,
  chars,
});

describe("teachingBatches", () => {
  test("packs chunks in reading order up to the cap", () => {
    expect(
      teachingBatches(
        [chunk("a", null, 40), chunk("b", null, 40), chunk("c", null, 40)],
        100,
      ),
    ).toEqual([["a", "b"], ["c"]]);
  });

  test("ends a batch at a new heading once it is half full, not before", () => {
    expect(
      teachingBatches(
        [
          chunk("a", "4.1", 30),
          chunk("b", "4.2", 10),
          chunk("c", "4.2", 20),
          chunk("d", "4.3", 30),
          chunk("e", "4.3", 30),
        ],
        100,
      ),
    ).toEqual([
      ["a", "b", "c"],
      ["d", "e"],
    ]);
  });

  test("gives a chunk over the cap a batch of its own", () => {
    expect(
      teachingBatches(
        [chunk("a", null, 10), chunk("big", null, 150), chunk("c", null, 10)],
        100,
      ),
    ).toEqual([["a"], ["big"], ["c"]]);
  });
});

test("unitHash changes with the text", () => {
  expect(unitHash(["a"])).toHaveLength(64);
  expect(unitHash(["a"])).not.toBe(unitHash(["b"]));
});
