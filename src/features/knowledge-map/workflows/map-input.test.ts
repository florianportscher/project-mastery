import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { firstSourcePlaces, type MapInput } from "./map-input";

const chunk = (id: string) => ({
  id,
  materialId: "m",
  heading: null,
  label: id,
  pageFrom: 1,
  pageTo: 1,
});
const kc = (id: string, origin: string, sources: string[]) => ({
  id,
  name: id,
  description: "",
  origin,
  sources,
});

function map(kcs: MapInput["kcs"], exercises: string[][]): MapInput {
  return {
    chunks: ["c0", "c1", "c2", "c3"].map(chunk),
    materials: [{ id: "m", name: "M" }],
    kcs,
    prerequisites: [],
    exercises,
  };
}

describe("firstSourcePlaces", () => {
  it("places an exercise KC right after the earliest KC its Exercise tests", () => {
    const places = firstSourcePlaces(
      map(
        [
          kc("a", "teaching", ["c1"]),
          kc("b", "teaching", ["c2"]),
          kc("x", "exercise", ["c3"]),
        ],
        [["x", "b", "a"]],
      ),
    );
    expect(places.get("a")).toBe(1);
    expect(places.get("x")).toBeGreaterThan(1);
    expect(places.get("x")).toBeLessThan(2);
  });

  it("keeps the first source's place without another KC in its Exercises", () => {
    const places = firstSourcePlaces(
      map([kc("x", "exercise", ["c3", "c2"])], [["x"]]),
    );
    expect(places.get("x")).toBe(2);
  });

  it("uses the earliest KC across two Exercises", () => {
    const places = firstSourcePlaces(
      map(
        [
          kc("a", "teaching", ["c2"]),
          kc("b", "teaching", ["c0"]),
          kc("x", "exercise", ["c3"]),
        ],
        [
          ["x", "a"],
          ["x", "b"],
        ],
      ),
    );
    expect(places.get("x")).toBe(0.5);
  });
});
