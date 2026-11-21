import { describe, expect, test } from "vitest";
import type { BriefExam } from "./intake";
import {
  askedExamIds,
  confirmedExams,
  oldExamsPart,
  unaskedExams,
} from "./old-exams";

const exam = (id: string, fields: Partial<BriefExam> = {}): BriefExam => ({
  id,
  name: `Klausur ${id}`,
  confirmed: null,
  asked: false,
  ...fields,
});

describe("confirmedExams", () => {
  test("keeps the exams the Student confirmed, in order", () => {
    expect(
      confirmedExams([
        exam("2023", { confirmed: true }),
        exam("2024", { confirmed: false }),
        exam("2025"),
        exam("2026", { confirmed: true }),
      ]),
    ).toEqual([
      { id: "2023", name: "Klausur 2023" },
      { id: "2026", name: "Klausur 2026" },
    ]);
  });
});

describe("unaskedExams", () => {
  test("asks about each found exam once, until it is answered", () => {
    expect(
      unaskedExams([
        exam("2023"),
        exam("2024", { asked: true }),
        exam("2025", { confirmed: false }),
      ]),
    ).toEqual([{ id: "2023", name: "Klausur 2023" }]);
  });
});

test("the asked exams are those the static questions listed, and every exam during intake", () => {
  const messages = [
    { parts: [{ type: "text" }, oldExamsPart(["a", "b"])] },
    { parts: [{ type: "text" }] },
  ];
  expect(askedExamIds(messages, [])).toEqual(["a", "b"]);
  expect(askedExamIds(messages, ["b", "c"])).toEqual(["a", "b", "c"]);
});
