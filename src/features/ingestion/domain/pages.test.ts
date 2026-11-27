import { describe, expect, test } from "vitest";
import { missingPages, noPageRead, overlayPages } from "./pages";

describe("noPageRead", () => {
  test("is true when pages are unreadable and none has an answer", () => {
    expect(noPageRead(["unreadable", "overlay", "blank"])).toBe(true);
  });

  test.each([null, "titles", "uncovered"])(
    "is false with a %s page",
    (skip) => {
      expect(noPageRead(["unreadable", skip])).toBe(false);
    },
  );

  test("is false when no page is unreadable", () => {
    expect(noPageRead([])).toBe(false);
    expect(noPageRead(["blank", "blank"])).toBe(false);
  });
});

describe("missingPages", () => {
  test("is every page when none is stored", () => {
    expect(missingPages(3, [])).toEqual([1, 2, 3]);
  });

  test("leaves out the pages with a stored result, in page order", () => {
    expect(missingPages(5, [4, 1, 2])).toEqual([3, 5]);
  });

  test("is empty when every page is stored", () => {
    expect(missingPages(2, [2, 1])).toEqual([]);
  });

  test("ignores stored pages beyond the page count", () => {
    expect(missingPages(2, [3])).toEqual([1, 2]);
  });
});

describe("overlayPages", () => {
  test("skips a slide whose text starts the next slide's, whatever the line breaks", () => {
    expect(
      overlayPages([
        "Vectors",
        "Vectors\nadd up.",
        "Vectors add up.\nThey scale.",
        "Matrices",
      ]),
    ).toEqual([1, 2]);
  });

  test("never skips a page without text or the last page", () => {
    expect(overlayPages(["", "Figure", "Figure"])).toEqual([2]);
  });
});
