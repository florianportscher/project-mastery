import { expect, test } from "vitest";
import { exerciseLabel } from "./exercise-label";

test("an Exercise is labelled by its heading and where it is printed", () => {
  expect(
    exerciseLabel({
      heading: "Aufgabe 3",
      materialName: "Exercises",
      pageFrom: 3,
    }),
  ).toBe("Aufgabe 3 · Exercises p. 3");
  expect(
    exerciseLabel({ heading: null, materialName: "Sheet 7", pageFrom: 1 }),
  ).toBe("Sheet 7 p. 1");
});
