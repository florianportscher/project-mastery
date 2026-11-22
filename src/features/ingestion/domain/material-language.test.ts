import { expect, test } from "vitest";
import { materialLanguageAndNotes, MAX_NOTES_CHARS } from "./material-language";

test("takes the language most pages name and each distinct note once", () => {
  expect(
    materialLanguageAndNotes([
      { language: "English", notes: "Vectors are rows." },
      { language: "German", notes: "" },
      { language: " German ", notes: "Vectors are rows." },
      { language: "x", notes: "⊂ allows equality." },
      { language: null, notes: null },
    ]),
  ).toEqual({
    language: "German",
    notes: "Vectors are rows.\n⊂ allows equality.",
  });
});

test("gives none without answers, and cuts long notes", () => {
  expect(materialLanguageAndNotes([])).toEqual({ language: null, notes: null });
  expect(
    materialLanguageAndNotes([{ language: "English", notes: "n".repeat(2000) }])
      .notes,
  ).toHaveLength(MAX_NOTES_CHARS);
});
