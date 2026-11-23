// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { nothingToMapReason } from "@/features/knowledge-map/domain/build-failure";
import { UNIT_CHARS } from "@/features/knowledge-map/domain/teaching-batches";
import { silenceLogs } from "@/lib/log-testing";
import { markAdminClient, type Supabase } from "@/lib/supabase/types";
import {
  COURSE,
  createBuildDb,
  deleteMaterial,
  flatTree,
  liveKcs,
  type SentCourse,
  topicTree,
  queueBuild,
  seedMaterial,
  STUDENT,
  useBuildModels,
} from "./build-testing";

/**
 * Update map in-process on the admin client's tables, with mock `map` and
 * `embed` models: KCs from batches of Materials, consolidated, in Course
 * order, resumed where a build stopped.
 */

vi.mock("server-only", () => ({}));

let db = createBuildDb();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => markAdminClient(db as unknown as Supabase),
}));

const { buildKnowledgeMap } = await import("./build-knowledge-map");

const build = () => db.tables.knowledge_map_builds[0];

const kcId = (name: string) => db.tables.kcs.find((kc) => kc.name === name)!.id;

/** The names the KC of this name assumes as text. */
const assumedBy = (name: string) =>
  (
    db.tables.kcs.find((kc) => kc.name === name)!.assumes as Array<{
      name: string;
    }>
  ).map((entry) => entry.name);

/** One KC per chunk, named by its Markdown and citing it. */
const kcPerChunk = {
  kcsOf: (unit: { chunks: Array<{ markdown: string }> }) =>
    unit.chunks.map((chunk) => chunk.markdown),
  chunkIdOf: (
    kc: string,
    unit: { chunks: Array<{ id: string; markdown: string }> },
  ) => unit.chunks.find((chunk) => chunk.markdown === kc)!.id,
};

/** Text that fills more than half of a unit. */
const halfAUnit = "word ".repeat(UNIT_CHARS / 10 + 1);

async function update() {
  queueBuild(db);
  await buildKnowledgeMap(COURSE);
}

beforeEach(() => {
  db = createBuildDb();
  silenceLogs("error", "warn");
});

describe("Update map", () => {
  test("extracts each Material under the cap as one batch, with its chunks' headings, and puts the KCs in Course order", async () => {
    // Uploaded second, but first in Course order.
    seedMaterial(db, {
      position: 1,
      language: "German",
      sections: [{ title: "Sums" }, { title: "Sheet 1", exercise: true }],
    });
    seedMaterial(db, {
      position: 0,
      language: "German",
      sections: [{ title: "Vectors", children: [{ title: "Bases" }] }],
    });
    seedMaterial(db, { position: 2, language: "English", sections: [] });
    const { extractions, reasoning } = useBuildModels({
      kcsOf: (unit) => unit.chunks.map((chunk) => chunk.markdown),
      chunkIdOf: (kc, unit) =>
        unit.chunks.find((chunk) => chunk.markdown === kc)!.id,
    });

    await update();

    expect(build()).toMatchObject({ status: "built", failure_reason: null });
    // Exercise chunks make no extraction call.
    expect(extractions).toEqual([
      {
        material: "Material 0",
        language: "German",
        chunks: [
          { id: "c1", heading: "Vectors", markdown: "About Vectors." },
          { id: "c2", heading: "Bases", markdown: "About Bases." },
        ],
        knownKcs: [],
      },
      expect.objectContaining({
        chunks: [{ id: "c1", heading: "Sums", markdown: "About Sums." }],
      }),
    ]);
    expect(reasoning.every((setting) => setting === "medium")).toBe(true);
    expect(liveKcs(db)).toEqual([
      "About Vectors.",
      "About Bases.",
      "About Sums.",
    ]);
    expect(db.tables.kc_sources).toHaveLength(3);
  });

  test("cuts a Material over the cap into batches, keyed by Material, kind and batch", async () => {
    const id = seedMaterial(db, {
      sections: [
        { title: "Vector spaces", chunks: ["Opening.", halfAUnit] },
        { title: "Bases", chunks: [`${halfAUnit}.`] },
      ],
    });
    const { extractions } = useBuildModels({
      kcsOf: (unit) => [unit.chunks.at(-1)!.markdown.slice(0, 4)],
      chunkIdOf: (_, unit) => unit.chunks.at(-1)!.id,
    });

    await update();

    expect(extractions.map((unit) => unit.chunks.length)).toEqual([2, 1]);
    expect(
      db.tables.unit_extractions.map((row) => [
        row.material_id,
        row.kind,
        row.batch,
      ]),
    ).toEqual([
      [id, "content", 0],
      [id, "content", 1],
    ]);
  });

  describe("a unit whose KCs cite less than half of it", () => {
    /** "Short" cites the unit's short chunk, any other KC its long one. */
    const useAnswers = (
      answers: string[][],
      afterCall?: (n: number) => void,
    ) => {
      seedMaterial(db, {
        sections: [{ title: "Vectors", chunks: ["Short.", halfAUnit] }],
      });
      return useBuildModels({
        kcsOf: () => (answers.length > 1 ? answers.shift()! : answers[0]!),
        chunkIdOf: (kc, unit) => unit.chunks[kc === "Short" ? 0 : 1]!.id,
        afterCall,
      }).extractions;
    };

    test("is asked once more, and the answer that covers more is kept", async () => {
      const extractions = useAnswers([["Short"], ["Long"]]);
      await update();
      expect(extractions).toHaveLength(2);
      expect(liveKcs(db)).toEqual(["Long"]);
      expect(build()?.check_report).toMatchObject({ unitsBelowCoverage: [] });
    });

    test("is stored still below the bar, and reported", async () => {
      const extractions = useAnswers([["Short"]]);
      await update();
      expect(extractions).toHaveLength(2);
      expect(build()?.status).toBe("built");
      expect(liveKcs(db)).toEqual(["Short"]);
      expect(build()?.check_report).toMatchObject({
        unitsBelowCoverage: [
          { unit: "Material 0 p. 1–2", coverage: expect.any(Number) },
        ],
      });
    });

    test("keeps its first answer when the Daily limit stops the retry", async () => {
      vi.stubEnv("AI_DAILY_LIMIT_USD", "1");
      const created_at = new Date().toISOString();
      const spend = { owner: STUDENT, task: "chat", cost_usd: 5, created_at };
      const atFirst = (n: number) => n === 1 && db.tables.ai_usage.push(spend);
      const extractions = useAnswers([["Short"]], (n) => void atFirst(n));
      await update();
      // The limit stops the build once the first answer is stored.
      expect(extractions).toHaveLength(1);
      expect(db.tables.unit_extractions).toHaveLength(1);
      expect(build()?.failure_reason).toBe("Daily limit reached");
    });
  });

  test("drops a KC that cites a chunk it was not offered, and builds the rest", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    useBuildModels({
      kcsOf: () => ["Vectors", "Ghost"],
      chunkIdOf: (kc, unit) => (kc === "Ghost" ? "c99" : unit.chunks[0]!.id),
    });

    await update();

    expect(build()?.status).toBe("built");
    expect(liveKcs(db)).toEqual(["Vectors"]);
  });

  test("offers each unit's call the KCs the units before it stored, in Course order", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }, { title: "Bases" }] });
    seedMaterial(db, { sections: [{ title: "Sums" }] });
    const { extractions } = useBuildModels(kcPerChunk);

    await update();

    expect(extractions.map((unit) => unit.knownKcs)).toEqual([
      [],
      [
        {
          id: "k1",
          heading: "Vectors",
          name: "About Vectors.",
          description: "About About Vectors..",
        },
        {
          id: "k2",
          heading: "Bases",
          name: "About Bases.",
          description: "About About Bases..",
        },
      ],
    ]);
  });

  test("adds a repeat's chunks to the known KC's sources and stores no KC for it", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    useBuildModels({ kcsOf: () => ["Vector"] });
    await update();
    const [first] = db.tables.kcs;

    seedMaterial(db, { sections: [{ title: "More vectors" }] });
    useBuildModels({ kcsOf: () => [], repeatsOf: () => ["Vector"] });
    await update();

    expect(db.tables.kcs.map((kc) => kc.id)).toEqual([first!.id]);
    expect(db.tables.kc_sources.map((row) => row.kc_id)).toEqual([
      first!.id,
      first!.id,
    ]);
  });

  test("records the stage and its count of sections done as it reads the Materials", async () => {
    for (const title of ["Vectors", "Sums", "Bases"]) {
      seedMaterial(db, { sections: [{ title }] });
    }
    const progress: unknown[] = [];
    useBuildModels({ afterCall: () => progress.push(build()!.progress) });

    await update();

    expect(progress).toEqual(
      [0, 1, 2].map((done) => ({
        stage: "materials",
        done,
        total: 3,
      })),
    );
    expect(build()).toMatchObject({
      status: "built",
      progress: { stage: "finishing" },
    });
  });

  test("makes no call for units it extracted before", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    seedMaterial(db, { sections: [{ title: "Sums" }] });
    useBuildModels();
    await update();

    const { extractions, checks, embedded } = useBuildModels();
    await update();

    expect(build()?.status).toBe("built");
    expect([extractions, checks, embedded]).toEqual([[], [], []]);
    expect(liveKcs(db)).toHaveLength(2);
  });

  test("links Prerequisites by id across units and within one, drops an unknown id, and keeps what is outside as text, once", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    seedMaterial(db, { sections: [{ title: "Bases" }] });
    const { checks } = useBuildModels({
      kcsOf: (unit) =>
        unit.material === "Material 0" ? ["Vectors"] : ["Spans", "Bases"],
      prerequisitesOf: (kc) =>
        kc === "Bases" ? ["Vectors", "Spans", "Ghost"] : [],
      assumesOf: (kc) => (kc === "Bases" ? ["Fields", " fields"] : []),
    });

    await update();

    expect(checks).toEqual([]);
    expect(
      db.tables.prerequisite_links.map((link) => [link.from_kc, link.to_kc]),
    ).toEqual([
      [kcId("Spans"), kcId("Bases")],
      [kcId("Vectors"), kcId("Bases")],
    ]);
    expect(assumedBy("Bases")).toEqual(["Fields"]);
    expect(liveKcs(db)).toEqual(["Vectors", "Spans", "Bases"]);
  });

  test("asks text of earlier KCs once against the KCs an update stored", async () => {
    const titleKc = (unit: { chunks: Array<{ markdown: string }> }) => [
      unit.chunks[0]!.markdown.slice("About ".length, -1),
    ];
    seedMaterial(db, { position: 1, sections: [{ title: "Bases" }] });
    useBuildModels({
      kcsOf: titleKc,
      assumesOf: (kc) => (kc === "Bases" ? ["Vectors", "Limits"] : []),
    });
    await update();
    expect(assumedBy("Bases")).toEqual(["Vectors", "Limits"]);

    // A Material earlier in Course order teaches Vectors.
    seedMaterial(db, { position: 0, sections: [{ title: "Vectors" }] });
    const { checks } = useBuildModels({ kcsOf: titleKc });
    await update();

    expect(
      checks.map((check) => [
        check.names.map((name) => name.name),
        check.kcs.map((kc) => kc.name),
      ]),
    ).toEqual([[["Limits", "Vectors"], ["Vectors"]]]);
    expect(
      db.tables.prerequisite_links.map((link) => [link.from_kc, link.to_kc]),
    ).toEqual([[kcId("Vectors"), kcId("Bases")]]);
    expect(assumedBy("Bases")).toEqual(["Limits"]);

    // Without new KCs, the text is not asked about again.
    const again = useBuildModels({ kcsOf: titleKc });
    await update();
    expect(again.checks).toEqual([]);
    expect(assumedBy("Bases")).toEqual(["Limits"]);
  });

  test("resumes a build the Daily limit stopped without repeating stored extractions", async () => {
    vi.stubEnv("AI_DAILY_LIMIT_USD", "1");
    for (const title of ["Vectors", "Sums", "Bases"]) {
      seedMaterial(db, { sections: [{ title }] });
    }
    const spend = {
      owner: STUDENT,
      task: "chat",
      cost_usd: 5,
      created_at: new Date().toISOString(),
    };
    useBuildModels({
      afterCall: (count) => {
        if (count === 1) db.tables.ai_usage.push(spend);
      },
    });

    await update();

    expect(build()).toMatchObject({
      status: "failed",
      failure_reason: "Daily limit reached",
    });
    expect(db.tables.unit_extractions).toHaveLength(1);

    db.tables.ai_usage = [];
    const { extractions } = useBuildModels();
    await update();

    expect(extractions.map((unit) => unit.material)).toEqual([
      "Material 1",
      "Material 2",
    ]);
    expect(build()?.status).toBe("built");
    expect(liveKcs(db)).toEqual(["Vectors", "Sums", "Bases"]);
  });

  test("retires the KCs of a deleted Material, keeping their Attempts, and revives one taught again", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    const notes = seedMaterial(db, { sections: [{ title: "Sums" }] });
    useBuildModels({ kcsOf: (unit) => [unit.chunks[0]!.markdown] });
    await update();
    const sums = db.tables.kcs.find((kc) => kc.name === "About Sums.")!;
    db.tables.attempts.push({ kc_id: sums.id, grade: "full" });

    deleteMaterial(db, notes);
    await update();

    expect(liveKcs(db)).toEqual(["About Vectors."]);
    expect(sums.retired_at).toBeTruthy();
    expect(db.tables.attempts).toHaveLength(1);

    seedMaterial(db, { sections: [{ title: "Sums" }] });
    await update();

    expect(sums.retired_at).toBeNull();
    expect(db.tables.kcs).toHaveLength(2);
    expect(liveKcs(db)).toEqual(["About Vectors.", "About Sums."]);
  });

  test("reports the pages no KC cites", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }, { title: "Sums" }] });
    useBuildModels({ kcsOf: () => ["Vectors"] });

    await update();

    expect(build()?.check_report).toMatchObject({
      uncitedPages: [{ material: "Material 0", pages: [2] }],
      exercisesWithoutKcs: [],
    });
  });

  test("makes the Topic tree call once, then keeps the tree and its ids without a call", async () => {
    seedMaterial(db, {
      language: "German",
      sections: [
        {
          title: "Vector spaces",
          children: [{ title: "Subspaces" }, { title: "Bases" }],
        },
      ],
    });
    // Vector spaces holds its opening's KC beside its sections' Topics.
    const nested = (course: SentCourse) =>
      flatTree(course).map((topic, index) => ({
        ...topic,
        level: index === 0 ? 1 : 2,
      }));
    const { trees, reasoning } = useBuildModels({
      ...kcPerChunk,
      treeOf: nested,
    });

    await update();

    expect(trees).toHaveLength(1);
    expect(trees[0]).toEqual({
      language: "German",
      kcs: ["Vector spaces", "Subspaces", "Bases"].map((heading, index) => ({
        id: `k${index + 1}`,
        name: `About ${heading}.`,
        material: "Material 0",
        heading,
      })),
      storedTopics: [],
    });
    expect(reasoning.every((setting) => setting === "medium")).toBe(true);
    expect(topicTree(db)).toEqual([
      "Vector spaces: About Vector spaces.",
      "Subspaces > Vector spaces: About Subspaces.",
      "Bases > Vector spaces: About Bases.",
    ]);
    const ids = db.tables.topics.map((topic) => topic.id);

    const again = useBuildModels(kcPerChunk);
    await update();

    expect(again.trees).toEqual([]);
    expect(db.tables.topics.map((topic) => topic.id)).toEqual(ids);
    expect(topicTree(db)).toHaveLength(3);
  });

  test("calls again when the KCs change, and keeps the Topics it continues", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    useBuildModels(kcPerChunk);
    await update();
    const [vectors] = db.tables.topics;

    seedMaterial(db, { sections: [{ title: "Sums" }] });
    const { trees } = useBuildModels(kcPerChunk);
    await update();

    expect(trees).toHaveLength(1);
    expect(trees[0]!.storedTopics).toEqual([
      { id: "t1", name: "Vectors", level: 1, kcs: ["k1"] },
    ]);
    expect(topicTree(db)).toEqual([
      "Vectors: About Vectors.",
      "Sums: About Sums.",
    ]);
    expect(db.tables.topics[0]!.id).toBe(vectors!.id);
  });

  test("puts a KC the call leaves out in the Topic of the KC before it", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }, { title: "Sums" }] });
    useBuildModels({
      ...kcPerChunk,
      treeOf: (course) => flatTree(course).slice(0, 1),
    });

    await update();

    expect(topicTree(db)).toEqual(["Vectors: About Vectors., About Sums."]);
  });

  test("keeps the stored tree when the tree call fails twice, and calls again on the next update", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    useBuildModels(kcPerChunk);
    await update();

    seedMaterial(db, { sections: [{ title: "Sums" }] });
    const { trees } = useBuildModels({
      ...kcPerChunk,
      treeOf: () => undefined,
    });
    await update();

    expect(trees).toHaveLength(2);
    expect(build()?.status).toBe("built");
    expect(topicTree(db)).toEqual(["Vectors: About Vectors., About Sums."]);

    const again = useBuildModels(kcPerChunk);
    await update();

    expect(again.trees).toHaveLength(1);
  });

  test("makes a Topic per Material when the first tree call fails twice", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }, { title: "Sums" }] });
    useBuildModels({ ...kcPerChunk, treeOf: () => undefined });

    await update();

    expect(topicTree(db)).toEqual(["Material 0: About Vectors., About Sums."]);
  });

  test("reports the pages read without units", async () => {
    const id = seedMaterial(db, { sections: [{ title: "Vectors" }] });
    db.tables.material_pages.push(
      { material_id: id, page_number: 4, skipped: "uncovered" },
      { material_id: id, page_number: 2, skipped: "unreadable" },
      { material_id: id, page_number: 3, skipped: "blank" },
    );
    useBuildModels();

    await update();

    expect(build()?.check_report).toMatchObject({
      unreadPages: [{ material: "Material 0", pages: [2, 4] }],
    });
  });

  test("fails with nothing to map when the Course has no chunks", async () => {
    seedMaterial(db, { sections: [] });
    useBuildModels();

    await update();

    expect(build()).toMatchObject({
      status: "failed",
      failure_reason: nothingToMapReason,
    });
  });
});
