import { readFile } from "node:fs/promises";
import path from "node:path";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { vi } from "vitest";
import {
  mockEmbeddingModel,
  useMockModels as useModels,
} from "@/lib/ai/testing";
import { MATERIALS_BUCKET } from "@/lib/supabase/buckets";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";

/**
 * Test helpers for the parse workflow in-process (`parse-material.ts`): the
 * admin client as a `fakeSupabase`, a seeded Material, and an `ingest` model
 * with canned batch results. Each test file mocks
 * `@/lib/supabase/admin` with its own `db`:
 *
 *   let db = createParseDb();
 *   vi.mock("@/lib/supabase/admin", () => ({
 *     createAdminClient: () => markAdminClient(db as unknown as Supabase),
 *   }));
 */

export const STUDENT = "11111111-1111-1111-1111-111111111111";
export const COURSE = "aaaaaaaa-c000-4000-8000-000000000001";
export const MATERIAL = "aaaaaaaa-0000-4000-8000-000000000001";
export const STORAGE_PATH = `${STUDENT}/${COURSE}/${MATERIAL}`;
export const BUCKET = MATERIALS_BUCKET;

/**
 * `useMockModels` for a parse test: the `embed` task answers too, unless the
 * test gives its own, because every parse ends by embedding its chunks. One
 * batch call runs at a time, so canned batch results answer batches in order.
 */
export function useMockModels(models: Parameters<typeof useModels>[0]) {
  useModels({ embed: mockEmbeddingModel(), ...models });
  vi.stubEnv("AI_CONCURRENCY", "1");
}

type ParseTable =
  "courses" | "materials" | "material_pages" | "chunks" | "ai_usage";

/**
 * The admin client a workflow has: no session, no Row Level Security.
 * `canAccess` lets a test make writes to a table fail.
 */
export function createParseDb({
  canAccess,
}: {
  canAccess?: (table: ParseTable) => boolean;
} = {}) {
  return fakeSupabase<ParseTable>({
    canAccess,
    tables: {
      courses: [] as FakeRow[],
      materials: [] as FakeRow[],
      material_pages: [] as FakeRow[],
      chunks: [] as FakeRow[],
      ai_usage: [] as FakeRow[],
    },
    foreignKeys: {
      material_pages: { material_id: "materials" },
      chunks: { material_id: "materials" },
    },
    // The fake's Storage lets this user write their folder.
    userId: STUDENT,
    defaults: {
      ai_usage: () => ({ created_at: new Date().toISOString() }),
    },
    functions: {
      // supabase/migrations/…_create_set_chunk_embeddings.sql.
      set_chunk_embeddings: (args, tables) => {
        for (const { id, embedding } of args.p_embeddings as Array<{
          id: string;
          embedding: string;
        }>) {
          const chunk = tables.chunks.find((row) => row.id === id);
          if (chunk) chunk.embedding = embedding;
        }
        return null;
      },
      // supabase/migrations/…_create_replace_material_chunks.sql, one
      // transaction there; tested with pgTAP.
      replace_material_chunks: (args, tables) => {
        const material = tables.materials.find(
          (row) => row.id === args.p_material_id,
        );
        if (!material) return null;
        const owned = {
          owner: material.owner,
          course_id: material.course_id,
          material_id: material.id,
        };
        tables.chunks = [
          ...tables.chunks.filter((chunk) => chunk.material_id !== material.id),
          ...(args.p_chunks as FakeRow[]).map((chunk) => ({
            id: crypto.randomUUID(),
            ...owned,
            ...chunk,
          })),
        ];
        return null;
      },
    },
  });
}

export type ParseDb = ReturnType<typeof createParseDb>;

export function seedCourse(db: ParseDb, id = COURSE) {
  if (db.tables.courses.some((course) => course.id === id)) return;
  db.tables.courses.push({
    id,
    owner: STUDENT,
    name: "Analysis",
  });
}

export const fixture = (name: string) =>
  readFile(path.join(import.meta.dirname, "test-files", name));

/**
 * A `queued` Material of the Student in their Course, with its file in
 * Storage: `MATERIAL` unless the test gives another id.
 */
export function seedMaterial(
  db: ParseDb,
  mediaType: string,
  body: Uint8Array,
  { id = MATERIAL, name = "Lecture 1" }: { id?: string; name?: string } = {},
) {
  seedCourse(db);
  const storagePath = `${STUDENT}/${COURSE}/${id}`;
  db.tables.materials.push({
    id,
    owner: STUDENT,
    course_id: COURSE,
    name,
    media_type: mediaType,
    size_bytes: body.byteLength,
    storage_path: storagePath,
    parse_status: "queued",
    pages_total: null,
    pages_done: 0,
    heartbeat_at: new Date().toISOString(),
  });
  db.files.seed(BUCKET, storagePath, { body, contentType: mediaType });
}

/** A unit of a canned batch result, on page 1 unless it says otherwise. */
export const unit = (overrides: Record<string, unknown>) => ({
  markdown: "",
  label: "content",
  pageFrom: 1,
  pageTo: 1,
  style: null,
  continuesFromPreviousBatch: false,
  continuesOnNextBatch: false,
  ...overrides,
});

/** A canned batch result; English without notes unless it says otherwise. */
type CannedBatch = {
  units: unknown;
  skippedPages?: unknown;
  language?: string;
  notes?: string;
};

type Prompt = Array<{ role: string; content: unknown }>;

/** Whether a call is a batch call: it carries page images. */
export const isPageCall = (prompt: unknown) =>
  (prompt as Prompt).some(
    (message) =>
      Array.isArray(message.content) &&
      (message.content as Array<{ type: string }>).some(
        (part) => part.type === "file",
      ),
  );

const usage = {
  inputTokens: {
    total: 1000,
    noCache: 1000,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 200, text: 200, reasoning: undefined },
};

/** A streamed answer of `text`, as a batch call reads it. */
export function streamedAnswer(text: string) {
  return {
    stream: simulateReadableStream({
      chunks: [
        { type: "text-start" as const, id: "text-1" },
        { type: "text-delta" as const, id: "text-1", delta: text },
        { type: "text-end" as const, id: "text-1" },
        {
          type: "finish" as const,
          finishReason: { unified: "stop" as const, raw: undefined },
          usage,
        },
      ],
    }),
  };
}

/**
 * The `ingest` model of a parse: answers each batch call (streamed; it
 * carries page images) with the next canned batch result, and remembers
 * what each was sent.
 */
export function pageModel(batches: CannedBatch[]) {
  const prompts: unknown[] = [];
  const model = new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      if (!isPageCall(prompt)) throw new Error("Not a page call.");
      prompts.push(prompt);
      // A strict schema makes the model list skipped pages every time.
      const answer = {
        language: "English",
        notes: "",
        skippedPages: [],
        units: [],
        ...batches[prompts.length - 1],
      };
      return streamedAnswer(JSON.stringify(answer));
    },
  });
  return { model, prompts };
}

export function sentImages(prompts: unknown[]) {
  return prompts.map((prompt) =>
    (prompt as Prompt)
      .filter((message) => message.role === "user")
      .flatMap((message) => message.content as Array<{ type: string }>)
      .filter((part) => part.type === "file")
      .map((part) => (part as unknown as { mediaType: string }).mediaType),
  );
}

export function storedChunks(db: ParseDb) {
  return db.tables.chunks
    .toSorted((a, b) => Number(a.position) - Number(b.position))
    .map((chunk) => ({
      position: chunk.position,
      page_from: chunk.page_from,
      page_to: chunk.page_to,
      label: chunk.label,
      markdown: chunk.markdown,
    }));
}
