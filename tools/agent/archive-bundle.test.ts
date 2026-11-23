import { describe, expect, it } from "vitest";
import { chatBundle, mapBundle, nextCaseId } from "./archive-bundle";
import type { Raw, Snapshot } from "./inspect";

const MATERIAL = "m1";
const SHA = "ab".repeat(32);

const snapshot = {
  course: { id: "c1", name: "Finance" },
  extractions: [
    // Extracted in the run: one call traced, one gone from Langfuse.
    {
      materialId: MATERIAL,
      kind: "content",
      batch: 0,
      createdAt: "2026-11-22T17:28:00Z",
    },
    {
      materialId: MATERIAL,
      kind: "content",
      batch: 1,
      createdAt: "2026-11-22T17:29:00Z",
    },
    // Reused from an earlier build: no call expected.
    {
      materialId: MATERIAL,
      kind: "exercise",
      batch: 0,
      createdAt: "2026-11-01T10:00:00Z",
    },
  ],
  build: {
    status: "built",
    failureReason: null,
    startedAt: "2026-11-22T17:27:01.34715+00:00",
    finishedAt: "2026-11-22T17:35:44+00:00",
    needsUpdate: false,
    appCommit: "f3a54da",
    checkReport: { duplicates: [] },
  },
} as unknown as Snapshot;

const call = (
  id: string,
  startTime: string,
  metadata: object,
  extra: Partial<Raw> = {},
): Raw => ({
  id,
  startTime,
  model: "muse-ember-1.0",
  totalCost: 0.001,
  metadata: { appCommit: "f3a54da", courseId: "c1", ...metadata },
  ...extra,
});

const bundle = mapBundle({
  caseId: "2026-11-23-map-1",
  note: "after #373",
  archivedAt: "2026-11-23T18:00:00.000Z",
  snapshot,
  chunks: [{ id: "k1", markdown: "# Heading" }],
  materials: [
    {
      id: MATERIAL,
      sha256: SHA,
      mediaType: "application/pdf",
      pagesTotal: 30,
      language: "de",
    },
  ],
  observations: [
    call(
      "parse",
      "2026-11-20T10:00:00Z",
      { materialId: MATERIAL },
      {
        input: [
          {
            role: "user",
            content: [
              { type: "text", text: "Page 7" },
              { type: "file", data: "iVBORw0KGgo=", mediaType: "image/png" },
            ],
          },
        ],
      },
    ),
    call("extract", "2026-11-22T17:28:00Z", {
      unitKey: `${MATERIAL}/content/0`,
    }),
    call("chat-reply", "2026-11-22T17:30:00Z", {
      "attributes.langfuse.session.id": "chat1",
    }),
    call("old-build", "2026-11-21T12:00:00Z", {
      unitKey: `${MATERIAL}/content/0`,
    }),
  ],
});

describe("mapBundle", () => {
  it("keeps the parse and the current build's calls, oldest first, without Chat calls", () => {
    expect(bundle.calls.map((c) => c.id)).toEqual(["parse", "extract"]);
  });

  it("replaces a page image by the Material's sha256 and the page", () => {
    expect(bundle.calls[0]?.input).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "Page 7" },
          { type: "file", material: SHA, page: 7 },
        ],
      },
    ]);
  });

  it("writes the manifest with the run's shape, labels and the missing calls", () => {
    expect(bundle.manifest).toMatchObject({
      caseId: "2026-11-23-map-1",
      kind: "map",
      note: "after #373",
      course: { id: "c1", name: "Finance" },
      shape: {
        materials: [
          { sha256: SHA, kind: "application/pdf", pages: 30, language: "de" },
        ],
      },
      run: { startedAt: "2026-11-22T17:27:01.347Z" },
      appCommits: ["f3a54da"],
      models: ["muse-ember-1.0"],
      cost: 0.002,
      calls: { archived: 2, missing: 1 },
      observations: [],
    });
    expect(bundle.run).toEqual({
      snapshot,
      chunks: [{ id: "k1", markdown: "# Heading" }],
    });
  });
});

describe("chatBundle", () => {
  const chat = (firstMessage: string) =>
    chatBundle({
      caseId: "2026-11-23-chat-1",
      note: null,
      archivedAt: "2026-11-23T18:00:00.000Z",
      snapshot,
      chat: { id: "chat1" },
      messages: [
        { created_at: firstMessage },
        { created_at: "2026-11-22T18:00:00Z" },
      ],
      materials: [],
      observations: [
        call("late", "2026-11-22T18:00:02Z", {}),
        call("early", "2026-11-22T18:00:01Z", {}),
      ],
    });

  it("keeps the Chat, its messages and the Course's build, calls oldest first", () => {
    const { manifest, run, calls } = chat("2026-11-22T17:00:00Z");
    expect(calls.map((c) => c.id)).toEqual(["early", "late"]);
    expect(run).toMatchObject({
      chat: { id: "chat1" },
      messages: [{}, {}],
      snapshot: { course: { id: "c1" } },
    });
    expect(manifest).toMatchObject({
      kind: "chat",
      chat: { id: "chat1" },
      calls: { archived: 2, missing: 0 },
    });
  });

  it("flags a Chat whose map was rebuilt after its first message", () => {
    expect(chat("2026-11-22T17:00:00Z").manifest.chat).toMatchObject({
      mapRebuiltAfterFirstMessage: true,
    });
    expect(chat("2026-11-22T18:00:00Z").manifest.chat).toMatchObject({
      mapRebuiltAfterFirstMessage: false,
    });
  });
});

describe("nextCaseId", () => {
  it("counts on from the day's cases of the same kind", () => {
    expect(
      nextCaseId(
        [
          "2026-11-23-map-1",
          "2026-11-23-map-2",
          "2026-11-23-chat-5",
          "2026-11-22-map-9",
        ],
        "2026-11-23",
        "map",
      ),
    ).toBe("2026-11-23-map-3");
    expect(nextCaseId([], "2026-11-23", "chat")).toBe("2026-11-23-chat-1");
  });
});
