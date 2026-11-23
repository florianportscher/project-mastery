import { describe, expect, test } from "vitest";
import { cosineSimilarity } from "./kc-similarity";

describe("cosineSimilarity", () => {
  test("is 1 for equal directions, 0 for orthogonal or zero vectors", () => {
    expect(cosineSimilarity([1, 1], [2, 2])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});
