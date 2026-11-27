// @vitest-environment node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createParseDb,
  isPageCall,
  streamedAnswer,
  unit,
  useMockModels,
} from "@/features/ingestion/workflows/parse-testing";
import { silenceLogs } from "@/lib/log-testing";
import { markAdminClient, type Supabase } from "@/lib/supabase/types";

/**
 * How a parse fails, resumes and stops: the parse workflow in-process on
 * the admin client's tables and Storage, with a mock page model.
 */

vi.mock("server-only", () => ({}));

const STUDENT = "11111111-1111-1111-1111-111111111111";
const COURSE = "aaaaaaaa-c000-4000-8000-000000000001";
const MATERIAL = "aaaaaaaa-0000-4000-8000-000000000001";
const STORAGE_PATH = `${STUDENT}/${COURSE}/${MATERIAL}`;
const BUCKET = "course-files";

const createDb = createParseDb;

let db = createDb();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => markAdminClient(db as unknown as Supabase),
}));

// Unpaced, as without AI_RPM, unless a test sets a wait.
vi.mock("@/lib/ai/pacing", () => ({ paceCall: vi.fn(async () => 0) }));
const { paceCall } = await import("@/lib/ai/pacing");

const { parseMaterial } = await import("./parse-material");
const { readPages } = await import("./parse-steps");

beforeEach(() => {
  db = createDb();
  silenceLogs("error", "warn");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(paceCall).mockReset();
});

async function seedLecture(file = "two-page-lecture.pdf") {
  const body = await readFile(
    path.join(import.meta.dirname, "test-files", file),
  );
  db.tables.materials.push({
    id: MATERIAL,
    owner: STUDENT,
    course_id: COURSE,
    name: "Lecture 1",
    media_type: "application/pdf",
    size_bytes: body.byteLength,
    storage_path: STORAGE_PATH,
    parse_status: "queued",
    pages_total: null,
    pages_done: 0,
    parse_failure: null,
  });
  db.files.seed(BUCKET, STORAGE_PATH, {
    body,
    contentType: "application/pdf",
  });
}

/** What the Student's delete leaves: no rows, and no files of the Material. */
function deleteMaterial() {
  db.tables.materials = [];
  db.tables.material_pages = [];
  db.tables.chunks = [];
  for (const file of db.files.paths(BUCKET)) {
    if (file.startsWith(STORAGE_PATH)) {
      void db.storage.from(BUCKET).remove([file]);
    }
  }
}

/** A batch result of one content unit on `page`. */
const pageResult = (markdown: string, page = 1, pageTo = page) => ({
  units: [unit({ markdown, pageFrom: page, pageTo })],
});

type Answer = { units: unknown } | Error;

/** A 429 of the provider's daily quota (docs/agents/live-ai.md). */
const dailyQuotaError = () =>
  new APICallError({
    message: "Quota exceeded",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode: 429,
    responseBody: JSON.stringify({
      error: {
        code: 429,
        status: "RESOURCE_EXHAUSTED",
        details: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [
              {
                quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
              },
            ],
          },
        ],
      },
    }),
    isRetryable: false,
  });

/**
 * A page model that answers the n-th batch call with `answers[n]`: a batch
 * result, or an error it throws. It counts its batch calls.
 */
function pageModel(answers: Answer[], onCall?: (call: number) => void) {
  let calls = 0;
  const model = new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      if (!isPageCall(prompt)) throw new Error("Not a page call.");
      const answer = answers[calls++] ?? { units: [] };
      onCall?.(calls);
      if (answer instanceof Error) throw answer;
      return streamedAnswer(
        JSON.stringify({
          language: "English",
          notes: "",
          skippedPages: [],
          ...answer,
        }),
      );
    },
  });
  return { model, calls: () => calls };
}

const material = () => db.tables.materials[0];

const storedPages = () =>
  db.tables.material_pages
    .toSorted((a, b) => Number(a.page_number) - Number(b.page_number))
    .map((page) => [page.page_number, page.skipped ?? null]);

describe("a batch whose call fails", () => {
  test.each([
    ["throws", new Error("bad output")],
    ["answers no batch result", { units: "nope" }],
  ])(
    "when the call %s, is read again page by page, a page that fails again is stored unreadable without units, and the parse ends parsed",
    async (_, answer) => {
      await seedLecture();
      const model = pageModel([answer, pageResult("Page one"), answer]);
      useMockModels({ ingest: model.model });

      await parseMaterial(MATERIAL);

      expect(model.calls()).toBe(3);
      expect(material()).toMatchObject({
        parse_status: "parsed",
        parse_failure: null,
        pages_done: 2,
      });
      expect(storedPages()).toEqual([
        [1, null],
        [2, "unreadable"],
      ]);
      expect(db.tables.material_pages[1]?.units).toEqual([]);
      expect(db.tables.chunks.map((chunk) => chunk.markdown)).toEqual([
        "Page one",
      ]);
    },
  );
});

describe("a parse that reads no page", () => {
  const reason = "No page could be read. Try again later.";

  test("fails with the reason and no chunks, and Retry reads both pages again", async () => {
    await seedLecture();
    const down = pageModel([...Array(6)].map(() => new Error("down")));
    useMockModels({ ingest: down.model });

    await parseMaterial(MATERIAL);

    expect(material()).toMatchObject({
      parse_status: "failed",
      parse_failure: reason,
    });
    expect(storedPages()).toEqual([
      [1, "unreadable"],
      [2, "unreadable"],
    ]);
    expect(db.tables.chunks).toEqual([]);

    const up = pageModel([pageResult("Page one"), pageResult("Page two", 2)]);
    useMockModels({ ingest: up.model });
    await parseMaterial(MATERIAL);

    expect(material()).toMatchObject({ parse_status: "parsed", pages_done: 2 });
    expect(storedPages()).toEqual([
      [1, null],
      [2, null],
    ]);
    expect(db.tables.chunks).toHaveLength(2);
  });

  test("fails an image Material whose call fails", async () => {
    const png = await readFile(
      path.join(import.meta.dirname, "test-files", "whiteboard.png"),
    );
    db.tables.materials.push({
      id: MATERIAL,
      owner: STUDENT,
      course_id: COURSE,
      name: "Board",
      media_type: "image/png",
      size_bytes: png.byteLength,
      storage_path: STORAGE_PATH,
      parse_status: "queued",
      pages_total: null,
      pages_done: 0,
      parse_failure: null,
    });
    db.files.seed(BUCKET, STORAGE_PATH, {
      body: png,
      contentType: "image/png",
    });
    useMockModels({
      ingest: pageModel([...Array(3)].map(() => new Error("down"))).model,
    });

    await parseMaterial(MATERIAL);

    expect(material()).toMatchObject({
      parse_status: "failed",
      parse_failure: reason,
    });
  });
});

describe("a failure of the app's own services", () => {
  const generic = "The material could not be parsed. Please try again.";

  test("while reading a page fails the parse with the general reason", async () => {
    await seedLecture();
    const model = pageModel([pageResult("Page one")]);
    useMockModels({ ingest: model.model });
    // The file opens for the page count, then Storage fails to read it again
    // for the read step.
    const from = db.storage.from;
    let downloads = 0;
    db.storage.from = (bucket: string) => {
      const store = from(bucket);
      return {
        ...store,
        download: async (path: string) =>
          ++downloads > 1
            ? { data: null, error: { message: "Storage failure", status: 500 } }
            : store.download(path),
      } as typeof store;
    };

    await parseMaterial(MATERIAL);

    expect(model.calls()).toBe(0);
    expect(material()).toMatchObject({
      parse_status: "failed",
      parse_failure: generic,
    });
  });
});

describe("a file that cannot be opened", () => {
  test("fails the parse with that reason, without a model call", async () => {
    await seedLecture();
    db.files.seed(BUCKET, STORAGE_PATH, {
      body: "not a pdf",
      contentType: "application/pdf",
    });
    const model = pageModel([]);
    useMockModels({ ingest: model.model });

    await parseMaterial(MATERIAL);

    expect(model.calls()).toBe(0);
    expect(material()).toMatchObject({
      parse_status: "failed",
      parse_failure: "The file could not be opened",
    });
  });
});

describe("the daily quota of the model provider", () => {
  test("a 429 for the daily quota fails the parse as a Daily limit, and Retry resumes at the first page without a row", async () => {
    await seedLecture();
    // The batch fails, page 1 is read on its own, then the quota is used up.
    const first = pageModel([
      new Error("bad output"),
      pageResult("Page one"),
      dailyQuotaError(),
    ]);
    useMockModels({ ingest: first.model });

    await parseMaterial(MATERIAL);

    expect(first.calls()).toBe(3);
    expect(material()).toMatchObject({
      parse_status: "failed",
      parse_failure: "Daily limit reached",
    });
    expect(storedPages()).toEqual([[1, null]]);

    const retried = pageModel([pageResult("Page two", 2)]);
    useMockModels({ ingest: retried.model });
    await parseMaterial(MATERIAL);

    expect(retried.calls()).toBe(1);
    expect(material()).toMatchObject({ parse_status: "parsed", pages_done: 2 });
    expect(
      db.tables.chunks.map((chunk) => [chunk.page_from, chunk.markdown]),
    ).toEqual([
      [1, "Page one"],
      [2, "Page two"],
    ]);
  });

  test("a Retry reads an earlier unreadable page again", async () => {
    await seedLecture();
    // Page 1 fails in the batch and alone, then the quota ends on page 2.
    const first = pageModel([
      new Error("bad output"),
      new Error("bad output"),
      dailyQuotaError(),
    ]);
    useMockModels({ ingest: first.model });
    await parseMaterial(MATERIAL);
    expect(material()).toMatchObject({
      parse_status: "failed",
      parse_failure: "Daily limit reached",
    });
    expect(storedPages()).toEqual([[1, "unreadable"]]);

    const retried = pageModel([
      {
        units: [
          ...pageResult("Page one").units,
          ...pageResult("Page two", 2).units,
        ],
      },
    ]);
    useMockModels({ ingest: retried.model });
    await parseMaterial(MATERIAL);

    expect(retried.calls()).toBe(1);
    expect(storedPages()).toEqual([
      [1, null],
      [2, null],
    ]);
  });
});

describe("deleting the Material while it parses", () => {
  test("stops the parse quietly and leaves no rows or files behind", async () => {
    await seedLecture();
    const model = pageModel(
      [pageResult("Pages one and two", 1, 2), pageResult("Again")],
      (call) => {
        if (call === 1) deleteMaterial();
      },
    );
    useMockModels({ ingest: model.model });

    await parseMaterial(MATERIAL);

    expect(model.calls()).toBe(1);
    expect(db.tables.materials).toEqual([]);
    expect(db.tables.material_pages).toEqual([]);
    expect(db.tables.chunks).toEqual([]);
    expect(db.files.paths(BUCKET)).toEqual([]);
  });
});

describe("a Material deleted while its file opens", () => {
  test("stops the parse quietly before any page is read", async () => {
    await seedLecture();
    const model = pageModel([]);
    useMockModels({ ingest: model.model });
    const from = db.storage.from;
    db.storage.from = (bucket: string) => {
      const store = from(bucket);
      return {
        ...store,
        download: async (path: string) => {
          const result = await store.download(path);
          deleteMaterial();
          return result;
        },
      } as typeof store;
    };

    await parseMaterial(MATERIAL);

    expect(model.calls()).toBe(0);
    expect(db.tables.materials).toEqual([]);
    expect(db.files.paths(BUCKET)).toEqual([]);
  });
});

describe("a started parse", () => {
  test("leaves `queued` before its file opens, so Parse is not offered while it runs", async () => {
    await seedLecture();
    useMockModels({ ingest: pageModel([]).model });
    const statuses: unknown[] = [];
    const from = db.storage.from;
    db.storage.from = (bucket: string) => {
      const store = from(bucket);
      return {
        ...store,
        download: async (path: string) => {
          statuses.push(material()?.parse_status);
          return store.download(path);
        },
      } as typeof store;
    };

    await parseMaterial(MATERIAL);

    expect(statuses[0]).toBe("parsing");
  });

  test("sets the heartbeat with every step", async () => {
    await seedLecture();
    material()!.heartbeat_at = "2026-01-01T00:00:00.000Z";
    useMockModels({ ingest: pageModel([]).model });

    await readPages(MATERIAL, [1]);

    expect(Date.parse(String(material()?.heartbeat_at))).toBeGreaterThan(
      Date.now() - 60_000,
    );
  });
});

describe("a read step", () => {
  test("run again after it stored its page neither calls the model nor records usage again", async () => {
    await seedLecture();
    const model = pageModel([pageResult("Page one"), pageResult("Again")]);
    useMockModels({ ingest: model.model });

    const first = await readPages(MATERIAL, [1]);
    const retried = await readPages(MATERIAL, [1]);

    expect([first, retried]).toEqual([
      { ok: true, left: [] },
      { ok: true, left: [] },
    ]);
    expect(model.calls()).toBe(1);
    expect(db.tables.ai_usage).toHaveLength(1);
    expect(storedPages()).toEqual([[1, null]]);
    expect(material()).toMatchObject({ pages_done: 1 });
  });

  test("starts no call after its time box and leaves the rest to the next step, which reads only those", async () => {
    await seedLecture("seven-page-script.pdf");
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    // Each batch call takes 200 seconds.
    const model = pageModel(
      [pageResult("Pages 1 to 5", 1, 5), pageResult("Pages 6 and 7", 6, 7)],
      () => {
        now += 200_000;
      },
    );
    useMockModels({ ingest: model.model });

    const step = await readPages(MATERIAL, [1, 2, 3, 4, 5, 6, 7]);

    expect(step).toEqual({ ok: true, left: [6, 7] });
    expect(storedPages().map(([page]) => page)).toEqual([1, 2, 3, 4, 5]);

    await parseMaterial(MATERIAL);

    expect(model.calls()).toBe(2);
    expect(storedPages().map(([page]) => page)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(material()).toMatchObject({ parse_status: "parsed" });
  });

  test("starts no call whose pace wait took it past its time box", async () => {
    await seedLecture("seven-page-script.pdf");
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    // With AI_RPM set, each call waits 60 seconds for its slot, and each
    // batch call takes 50 seconds: the second batch fits the step at 110
    // seconds, but not after its wait, at 170.
    vi.mocked(paceCall).mockImplementation(async () => {
      now += 60_000;
      return 60_000;
    });
    const model = pageModel(
      [pageResult("Pages 1 to 5", 1, 5), pageResult("Pages 6 and 7", 6, 7)],
      () => {
        now += 50_000;
      },
    );
    useMockModels({ ingest: model.model });

    const step = await readPages(MATERIAL, [1, 2, 3, 4, 5, 6, 7]);

    expect(step).toEqual({ ok: true, left: [6, 7] });
    expect(model.calls()).toBe(1);
  });
});
