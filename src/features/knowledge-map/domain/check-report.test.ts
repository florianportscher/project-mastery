import { expect, test } from "vitest";
import type { CheckReport } from "@/features/knowledge-map/schemas";
import { checkReportLine, pagesText, uncitedPages } from "./check-report";

const report = (over: Partial<CheckReport>): CheckReport => ({
  uncitedPages: [],
  exercisesWithoutKcs: [],
  duplicates: [],
  unitsBelowCoverage: [],
  unreadPages: [],
  unitsNotExtracted: [],
  exercisesNotGrouped: false,
  ...over,
});

test("pagesText gives single pages and runs of pages", () => {
  expect(pagesText([10])).toBe("p. 10");
  expect(pagesText([38, 10, 36, 37])).toBe("pp. 10, 36–38");
});

test("names unread pages and the places covered in part, in one line", () => {
  expect(
    checkReportLine(
      report({
        unreadPages: [{ material: "Notes", pages: [10, 36, 37, 38] }],
        unitsBelowCoverage: [
          { unit: "Notes p. 1–4", coverage: 0.2 },
          { unit: "Notes p. 5–9", coverage: 0.4 },
        ],
        unitsNotExtracted: ["Notes p. 5–9", "Sheet 1 p. 1"],
      }),
    ),
  ).toBe(
    "The AI couldn't read pp. 10, 36–38 and covered Notes p. 1–4, Notes p. 5–9 and 1 more only in part",
  );
  expect(
    checkReportLine(
      report({
        unreadPages: [
          { material: "Notes", pages: [3] },
          { material: "Sheet 1", pages: [1, 2] },
        ],
      }),
    ),
  ).toBe("The AI couldn't read Notes p. 3, Sheet 1 pp. 1–2");
});

test("says nothing for a full build or no report", () => {
  expect(
    checkReportLine(report({ uncitedPages: [{ material: "A", pages: [1] }] })),
  ).toBeNull();
  expect(checkReportLine(null)).toBeNull();
});

test("uncitedPages lists the pages whose content chunks no KC cites", () => {
  const chunk = (
    id: string,
    pageFrom: number,
    pageTo = pageFrom,
    label = "content",
  ) => ({ id, materialId: "m", label, pageFrom, pageTo });
  expect(
    uncitedPages(
      [{ id: "m", name: "Notes" }],
      [
        chunk("a", 1, 2),
        chunk("b", 2),
        chunk("c", 3, 4),
        chunk("x", 5, 5, "exercise"),
      ],
      new Set(["b"]),
    ),
  ).toEqual([{ material: "Notes", pages: [1, 3, 4] }]);
});
