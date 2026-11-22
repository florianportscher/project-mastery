import { describe, expect, test, vi } from "vitest";

// The courses entry without its components, which need Next.js.
vi.mock("@/features/courses", async () =>
  vi.importActual("@/features/courses/domain/course-paths"),
);

const { materialChunksPath } = await import("@/features/courses");
const { citedSource } = await import("./sources");

const COURSE = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER_COURSE = "aaaaaaaa-0000-4000-8000-000000000009";
const MATERIAL = "bbbbbbbb-0000-4000-8000-000000000002";

describe("citedSource", () => {
  test.each([
    [{ from: 10, to: 11 }, 10, 11],
    [{ from: 10, to: 10 }, 10, 10],
  ])("reads the page link written for %o", (pages, pageFrom, pageTo) => {
    expect(
      citedSource(materialChunksPath(COURSE, MATERIAL, pages), COURSE),
    ).toEqual({ kind: "pages", materialId: MATERIAL, pageFrom, pageTo });
  });

  test.each([
    [
      "another Course's link",
      materialChunksPath(OTHER_COURSE, MATERIAL, { from: 1, to: 2 }),
    ],
    ["a backwards range", `${materialChunksPath(COURSE, MATERIAL)}?pages=5-3`],
    ["page 0", `${materialChunksPath(COURSE, MATERIAL)}?pages=0`],
    ["a garbled Material id", `/courses/${COURSE}/materials/bbbb?pages=1`],
    ["a Material link without pages", materialChunksPath(COURSE, MATERIAL)],
    ["an outside link", "https://example.com"],
  ])("ignores %s", (_case, href) => {
    expect(citedSource(href, COURSE)).toBeNull();
  });
});
