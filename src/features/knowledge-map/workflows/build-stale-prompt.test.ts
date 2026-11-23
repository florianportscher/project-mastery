// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { silenceLogs } from "@/lib/log-testing";
import { markAdminClient, type Supabase } from "@/lib/supabase/types";
import {
  COURSE,
  createBuildDb,
  liveKcs,
  queueBuild,
  seedMaterial,
  unitHeadings,
  useBuildModels,
} from "./build-testing";

/** Update map after a prompt change made stored extractions stale. */

vi.mock("server-only", () => ({}));

let db = createBuildDb();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => markAdminClient(db as unknown as Supabase),
}));

const { buildKnowledgeMap } = await import("./build-knowledge-map");

const kcId = (name: string) => db.tables.kcs.find((kc) => kc.name === name)!.id;

async function update() {
  queueBuild(db);
  await buildKnowledgeMap(COURSE);
}

beforeEach(() => {
  db = createBuildDb();
  silenceLogs("error", "warn");
});

describe("Update map with a changed prompt", () => {
  test("replaces the KCs of every batch an updated prompt makes stale, without offering one stale batch another's KCs", async () => {
    seedMaterial(db, { sections: [{ title: "Vectors" }] });
    seedMaterial(db, { sections: [{ title: "Sums" }] });
    useBuildModels();
    await update();
    expect(liveKcs(db)).toEqual(["Vectors", "Sums"]);

    // The prompt changed: both stored extractions are stale, and the new
    // answers name other KCs, the first one trying to repeat a stale KC.
    for (const row of db.tables.unit_extractions) row.prompt_digest = "older";
    const again = useBuildModels({
      kcsOf: (unit) =>
        unitHeadings(unit).map((heading) =>
          heading === "Vectors" ? "Arrows" : "Totals",
        ),
      repeatsOf: (unit) =>
        unit.knownKcs.some((kc) => kc.name === "Sums") ? ["Sums"] : [],
    });
    await update();

    expect(again.extractions.map((unit) => unit.knownKcs)).toEqual([
      [],
      [expect.objectContaining({ name: "Arrows" })],
    ]);
    expect(liveKcs(db)).toEqual(["Arrows", "Totals"]);
    // Each live KC is sourced on its own batch's chunk only.
    const chunkOf = (heading: string) =>
      db.tables.chunks.find((chunk) => chunk.heading === heading)!.id;
    const sourcesOf = (name: string) =>
      db.tables.kc_sources
        .filter((source) => source.kc_id === kcId(name))
        .map((source) => source.chunk_id);
    expect(sourcesOf("Arrows")).toEqual([chunkOf("Vectors")]);
    expect(sourcesOf("Totals")).toEqual([chunkOf("Sums")]);
    const retired = db.tables.kcs
      .filter((kc) => kc.retired_at)
      .map((kc) => kc.id);
    expect(
      db.tables.kc_sources.filter((source) => retired.includes(source.kc_id)),
    ).toEqual([]);

    const third = useBuildModels();
    await update();
    expect(third.extractions).toEqual([]);
  });
});
