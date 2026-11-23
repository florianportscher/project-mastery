// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { silenceLogs } from "@/lib/log-testing";
import { markAdminClient, type Supabase } from "@/lib/supabase/types";
import {
  COURSE,
  createBuildDb,
  liveKcs,
  queueBuild,
  seedMaterial,
  useBuildModels,
} from "./build-testing";

/**
 * Update map with extraction calls that fail: a failed unit waits a step,
 * is then called in pieces, and is given up rather than failing the build.
 */

vi.mock("server-only", () => ({}));

const sleep = vi.hoisted(() => vi.fn(async (ms: number) => void ms));
vi.mock("workflow", async (original) => ({
  ...(await original<typeof import("workflow")>()),
  sleep,
}));

let db = createBuildDb();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => markAdminClient(db as unknown as Supabase),
}));

const { buildKnowledgeMap } = await import("./build-knowledge-map");

const build = () => db.tables.knowledge_map_builds[0];

async function update() {
  queueBuild(db);
  await buildKnowledgeMap(COURSE);
}

beforeEach(() => {
  db = createBuildDb();
  sleep.mockClear();
  silenceLogs("error", "warn");
});

test("stores the units answered before the rate limit, and extracts the rest after its wait", async () => {
  for (const title of ["Vectors", "Sums", "Bases"]) {
    seedMaterial(db, { sections: [{ title }] });
  }
  // The third call meets the limit, which names 20 s.
  const { extractions } = useBuildModels({ rateLimitedCalls: [3] });
  const storedAtWait: number[] = [];
  const progressAtWait: unknown[] = [];
  sleep.mockImplementation(async () => {
    storedAtWait.push(db.tables.unit_extractions.length);
    progressAtWait.push(build()!.progress);
  });

  await update();

  expect(sleep.mock.calls).toEqual([[60_000]]);
  expect(storedAtWait).toEqual([2]);
  expect(progressAtWait).toEqual([
    {
      stage: "materials",
      done: 2,
      total: 3,
      waitUntil: expect.stringMatching(/^\d{4}-/),
    },
  ]);
  expect(extractions.map((unit) => unit.material)).toEqual([
    "Material 0",
    "Material 1",
    "Material 2",
  ]);
  expect(build()).toMatchObject({
    status: "built",
    check_report: expect.objectContaining({ unitsNotExtracted: [] }),
  });
  expect(liveKcs(db)).toEqual(["Vectors", "Sums", "Bases"]);
});

test("stores an answer with no KCs without asking again", async () => {
  seedMaterial(db, { sections: [{ title: "Notation" }] });
  const { extractions } = useBuildModels({ kcsOf: () => [] });

  await update();

  expect(extractions).toHaveLength(1);
  expect(db.tables.unit_extractions).toHaveLength(1);
  expect(build()).toMatchObject({
    status: "built",
    check_report: expect.objectContaining({
      uncitedPages: [{ material: "Material 0", pages: [1] }],
    }),
  });
});

test("leaves a unit whose call gives no answer to the next step", async () => {
  seedMaterial(db, { sections: [{ title: "Vectors" }] });
  const { extractions } = useBuildModels({ blankCalls: 1 });

  await update();

  expect(extractions).toHaveLength(1);
  expect(build()?.status).toBe("built");
  expect(liveKcs(db)).toEqual(["Vectors"]);
});

test("leaves a unit whose call times out to the next step, and gives a single chunk up when it times out there too", async () => {
  seedMaterial(db, { sections: [{ title: "Vectors" }] });
  useBuildModels({ timeoutCalls: 1 });

  await update();

  expect(build()?.status).toBe("built");
  expect(db.tables.ai_usage).toContainEqual(
    expect.objectContaining({ task: "map", estimated: true }),
  );

  seedMaterial(db, { sections: [{ title: "Sums" }] });
  useBuildModels({ timeoutCalls: 2 });

  await update();

  expect(build()).toMatchObject({
    status: "built",
    check_report: expect.objectContaining({
      unitsNotExtracted: ["Material 1 p. 1"],
    }),
  });
  expect(db.tables.unit_extractions).toHaveLength(1);
});

test("calls a unit that failed twice in halves, and keeps the halves answered", async () => {
  seedMaterial(db, {
    sections: [{ title: "Vectors", chunks: ["About sums.", "About bases."] }],
  });
  const { extractions } = useBuildModels({
    kcsOf: (unit) => unit.chunks.map((chunk) => chunk.markdown),
    chunkIdOf: (kc, unit) =>
      unit.chunks.find((chunk) => chunk.markdown === kc)!.id,
    timeoutCalls: 3,
  });

  await update();

  // Whole twice and one half time out; each half is answered once.
  expect(
    db.tables.ai_usage.filter((row) => row.task === "map" && row.estimated),
  ).toHaveLength(3);
  expect(extractions.map((unit) => unit.chunks.length)).toEqual([1, 1]);
  expect(build()).toMatchObject({
    status: "built",
    check_report: expect.objectContaining({ unitsNotExtracted: [] }),
  });
  expect(liveKcs(db)).toEqual(["About sums.", "About bases."]);
  expect(db.tables.unit_extractions).toHaveLength(1);
});
