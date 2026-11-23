import { describe, expect, test } from "vitest";
import { missingPages, overlayPages } from "./pages";

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
