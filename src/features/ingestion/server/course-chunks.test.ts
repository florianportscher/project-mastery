// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";
import type { Supabase } from "@/lib/supabase/types";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/user", () => ({ getUser: async () => ({ id: "me" }) }));

const { loadChunkSources, loadChunkMaterials } =
  await import("./course-chunks");

const COURSE = "course-1";

/** A Material at `position` in Course order. */
const material = (
  id: string,
  position: number,
  parseStatus = "parsed",
  courseId = COURSE,
): FakeRow => ({
  id,
  course_id: courseId,
  name: `Material ${id}`,
  parse_status: parseStatus,
  position,
});

const chapter = (
  id: string,
  parentId: string | null,
  depth: number,
  title: string,
): FakeRow => ({
  id,
  course_id: COURSE,
  material_id: "a",
  parent_id: parentId,
  depth,
  title,
});

/** `count` chunks of `materialId`, stored in reverse reading order. */
const chunksOf = (materialId: string, count: number): FakeRow[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${materialId}-${String(i).padStart(4, "0")}`,
    material_id: materialId,
    position: i,
    page_from: 1,
    page_to: 1,
    label: "content",
    markdown: `text ${i}`,
    chapter_id: null,
  })).reverse();

/**
 * The fake with PostgREST's limits: at most 1,000 rows per response. Records
 * the length of every `in` list, which must stay short for the query string.
 */
function withRowLimit(tables: {
  materials: FakeRow[];
  chunks: FakeRow[];
  chapters: FakeRow[];
}) {
  const db = fakeSupabase({ tables });
  const inLengths: number[] = [];
  const client = {
    ...db,
    from(table: "materials" | "chunks" | "chapters") {
      const builder = db.from(table);
      const { in: filterIn, then } = builder;
      builder.in = (column, values) => {
        inLengths.push(values.length);
        return filterIn(column, values);
      };
      builder.then = (resolve, reject) =>
        then(
          (result) =>
            resolve!({
              ...result,
              data: Array.isArray(result.data)
                ? result.data.slice(0, 1000)
                : result.data,
            }),
          reject,
        );
      return builder;
    },
  };
  return { client, inLengths };
}

let tables: { materials: FakeRow[]; chunks: FakeRow[]; chapters: FakeRow[] };
beforeEach(() => {
  tables = {
    materials: [
      material("b", 1),
      material("a", 0),
      material("unparsed", 2, "parsing"),
      material("other", 0, "parsed", "course-2"),
    ],
    chunks: [
      ...chunksOf("b", 2),
      ...chunksOf("a", 1500),
      ...chunksOf("unparsed", 3),
      ...chunksOf("other", 3),
    ],
    // Material a: 4 Vector Spaces, and Klausur 2023 with a problem inside.
    chapters: [
      chapter("root-a", null, 0, "Material a"),
      chapter("c4", "root-a", 1, "4 Vector Spaces"),
      chapter("exam", "root-a", 1, "Klausur 2023"),
      chapter("problem", "exam", 2, "Aufgabe 1"),
    ],
  };
});

describe("loadChunkMaterials", () => {
  test("reads every chunk of the Course with its Material", async () => {
    tables.chunks = tables.chunks.map((chunk) => ({
      ...chunk,
      course_id: chunk.material_id === "other" ? "course-2" : COURSE,
    }));
    const { client } = withRowLimit(tables);

    const { chunkMaterials, materials } = await loadChunkMaterials(
      client as unknown as Supabase,
      COURSE,
    );

    expect(Object.keys(chunkMaterials)).toHaveLength(1505);
    expect(chunkMaterials["b-0001"]).toBe("b");
    expect(materials.b).toEqual({ name: "Material b" });
  });
});

describe("loadChunkSources", () => {
  const ids = [
    "b-0001",
    "missing",
    ...Array.from(
      { length: 150 },
      (_, i) => `a-${String(149 - i).padStart(4, "0")}`,
    ),
    "b-0000",
    "a-0000",
  ];

  test("read more than 100 ids whole, skipping missing ones", async () => {
    const chapterOf = (id: string, chapterId: string) => {
      tables.chunks.find((chunk) => chunk.id === id)!.chapter_id = chapterId;
    };
    chapterOf("a-0000", "c4");
    chapterOf("a-0001", "root-a");
    chapterOf("a-0002", "problem");
    const { client, inLengths } = withRowLimit(tables);

    const sources = await loadChunkSources(client as unknown as Supabase, ids);

    expect(sources.map((source) => source.id)).toEqual([
      ...Array.from(
        { length: 150 },
        (_, i) => `a-${String(i).padStart(4, "0")}`,
      ),
      "b-0000",
      "b-0001",
    ]);
    expect(sources[0]).toMatchObject({
      materialName: "Material a",
      pageTo: 1,
      chapterTitle: "4 Vector Spaces",
    });
    // A Material's root Chapter is no Chapter title.
    expect(sources[1]!.chapterTitle).toBeNull();
    expect(sources[2]!.chapterTitle).toBe("Aufgabe 1");
    expect(sources.slice(3).map((source) => source.chapterTitle)).toEqual(
      sources.slice(3).map(() => null),
    );
    expect(Math.max(...inLengths)).toBeLessThanOrEqual(100);
  });

  test("give nothing when no id is found", async () => {
    const { client } = withRowLimit(tables);

    await expect(
      loadChunkSources(client as unknown as Supabase, ["missing"]),
    ).resolves.toEqual([]);
  });
});
