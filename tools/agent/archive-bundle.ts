import { type Raw, type Snapshot, toCall } from "./inspect";

/**
 * The files of one case bundle (issue #383, docs/agents/cases.md), assembled
 * from what the archive read, without any I/O: the manifest, the run and the
 * run's model calls.
 */

/** A Material as the manifest names it: by the sha256 of its file. */
export type ArchivedMaterial = {
  id: string;
  sha256: string;
  mediaType: string;
  pagesTotal: number | null;
  language: string | null;
};

export type Manifest = {
  caseId: string;
  kind: "map" | "chat";
  note: string | null;
  archivedAt: string;
  course: { id: string; name: string };
  shape: {
    materials: Array<{
      id: string;
      sha256: string;
      kind: string;
      pages: number | null;
      language: string | null;
    }>;
  };
  run: {
    status: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    appCommit: string | null;
  };
  appCommits: string[];
  models: string[];
  cost: number;
  calls: { archived: number; missing: number };
  observations: string[];
  /** A Chat's case: the Chat, and whether the map was rebuilt after its first message. */
  chat?: { id: string; messages: number; mapRebuiltAfterFirstMessage: boolean };
};

/** One archived model call, a line of `calls.jsonl.gz`. */
export type ArchivedCall = {
  id: string;
  traceName: string;
  model: string | null;
  startTime: string;
  endTime: string | null;
  level: string;
  statusMessage: string | null;
  metadata: Record<string, unknown>;
  usage: Record<string, unknown>;
  cost: number | null;
  input: unknown;
  output: unknown;
};

export type MapBundleInput = {
  caseId: string;
  note: string | null;
  archivedAt: string;
  snapshot: Snapshot;
  chunks: Array<{ id: string; markdown: string }>;
  materials: ArchivedMaterial[];
  observations: Raw[];
};

const utc = (time: string | null | undefined) =>
  time ? new Date(time).toISOString() : null;

const PAGE_LABEL = /^Page (\d+)$/;

type Part = { type?: unknown; text?: unknown; mediaType?: unknown };
const isPart = (value: unknown): value is Part =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The value with every file or image part replaced by the page it shows: the
 * Material's sha256 and the number of the `Page N` text part before it, as the
 * parse sends them (`batchMessages` in ingestion).
 */
export function replacePageImages(
  value: unknown,
  material: string | null,
): unknown {
  if (Array.isArray(value)) {
    let page: number | null = null;
    return value.map((item) => {
      if (!isPart(item)) return replacePageImages(item, material);
      if (item.type === "text" && typeof item.text === "string") {
        const label = PAGE_LABEL.exec(item.text.trim());
        if (label) page = Number(label[1]);
      }
      if (item.type === "file" || item.type === "image") {
        return { type: item.type, material, page };
      }
      return replacePageImages(item, material);
    });
  }
  if (isPart(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        replacePageImages(inner, material),
      ]),
    );
  }
  return value;
}

/**
 * The run's calls: each model call once, of the parse of the Course's current
 * Materials and of its current build (from its start to its end).
 */
function runCalls(
  observations: Raw[],
  snapshot: Snapshot,
  materialIds: Set<string>,
): Raw[] {
  const parents = new Set(observations.map((o) => o.parentObservationId));
  const from = snapshot.build ? Date.parse(snapshot.build.startedAt) : Infinity;
  const to = snapshot.build?.finishedAt
    ? Date.parse(snapshot.build.finishedAt)
    : Infinity;
  return observations
    .filter((o) => !parents.has(o.id))
    .filter((o) => {
      const materialId = o.metadata?.materialId;
      if (typeof materialId === "string" && materialIds.has(materialId))
        return true;
      const start = Date.parse(o.startTime);
      return start >= from && start <= to;
    })
    .toSorted((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * The build's units that were extracted during the run but have no traced
 * call: their calls are gone, such as after Langfuse's 30 days.
 */
function missingCalls(snapshot: Snapshot, calls: ArchivedCall[]): number {
  if (!snapshot.build) return 0;
  const from = Date.parse(snapshot.build.startedAt);
  const traced = new Set(calls.map((c) => c.metadata.unitKey));
  return snapshot.extractions.filter(
    (e) =>
      e.createdAt &&
      Date.parse(e.createdAt) >= from &&
      !traced.has(`${e.materialId}/${e.kind}/${e.batch}`),
  ).length;
}

const distinct = (values: Array<string | null | undefined>) =>
  [...new Set(values.filter((v): v is string => !!v))].toSorted();

/** One Langfuse observation as an archived call, its page images named by Material sha256. */
function archivedCall(o: Raw, sha: Map<string, string>): ArchivedCall {
  const call = toCall(o);
  const materialId = o.metadata?.materialId;
  const material =
    typeof materialId === "string" ? (sha.get(materialId) ?? null) : null;
  return {
    id: o.id,
    traceName: call.name,
    model: call.model,
    startTime: o.startTime,
    endTime: call.endTime,
    level: call.level,
    statusMessage: call.statusMessage,
    metadata: o.metadata ?? {},
    usage: o.usageDetails ?? {},
    cost: call.cost,
    input: replacePageImages(o.input, material),
    output: o.output,
  };
}

type Common = Pick<
  MapBundleInput,
  "caseId" | "note" | "archivedAt" | "snapshot" | "materials"
>;

/** The manifest fields both kinds share. */
function manifestOf(
  input: Common,
  kind: Manifest["kind"],
  calls: ArchivedCall[],
  missing: number,
): Manifest {
  const { snapshot } = input;
  return {
    caseId: input.caseId,
    kind,
    note: input.note,
    archivedAt: input.archivedAt,
    course: { id: snapshot.course.id, name: snapshot.course.name },
    shape: {
      materials: input.materials.map((m) => ({
        id: m.id,
        sha256: m.sha256,
        kind: m.mediaType,
        pages: m.pagesTotal,
        language: m.language,
      })),
    },
    run: {
      status: snapshot.build?.status ?? null,
      startedAt: utc(snapshot.build?.startedAt),
      finishedAt: utc(snapshot.build?.finishedAt),
      appCommit: snapshot.build?.appCommit ?? null,
    },
    appCommits: distinct(
      calls.map((c) => c.metadata.appCommit as string | undefined),
    ),
    models: distinct(calls.map((c) => c.model)),
    cost: Number(calls.reduce((sum, c) => sum + (c.cost ?? 0), 0).toFixed(6)),
    calls: { archived: calls.length, missing },
    observations: [],
  };
}

/** The manifest, `run.json` and `calls.jsonl` of a Course's map build. */
export function mapBundle(input: MapBundleInput): {
  manifest: Manifest;
  run: object;
  calls: ArchivedCall[];
} {
  const { snapshot } = input;
  const sha = new Map(input.materials.map((m) => [m.id, m.sha256]));
  const calls = runCalls(
    input.observations,
    snapshot,
    new Set(input.materials.map((m) => m.id)),
  ).map((o) => archivedCall(o, sha));
  return {
    manifest: manifestOf(input, "map", calls, missingCalls(snapshot, calls)),
    run: { snapshot, chunks: input.chunks },
    calls,
  };
}

export type ChatBundleInput = Common & {
  chat: { id: string };
  /** The Chat's messages, oldest first, as stored (each reply with its tutor context). */
  messages: Array<{ created_at: string }>;
  observations: Raw[];
};

/**
 * The manifest, `run.json` and `calls.jsonl` of a Chat: the Chat, its
 * messages and its Course's build snapshot, and every model call of the
 * Chat's session. The manifest flags a Chat whose map was rebuilt after its
 * first message.
 */
export function chatBundle(input: ChatBundleInput): {
  manifest: Manifest;
  run: object;
  calls: ArchivedCall[];
} {
  const { snapshot, chat, messages } = input;
  const sha = new Map(input.materials.map((m) => [m.id, m.sha256]));
  const parents = new Set(input.observations.map((o) => o.parentObservationId));
  const calls = input.observations
    .filter((o) => !parents.has(o.id))
    .toSorted((a, b) => a.startTime.localeCompare(b.startTime))
    .map((o) => archivedCall(o, sha));
  const first = messages[0]?.created_at;
  const built = snapshot.build?.startedAt;
  return {
    manifest: {
      ...manifestOf(input, "chat", calls, 0),
      chat: {
        id: chat.id,
        messages: messages.length,
        mapRebuiltAfterFirstMessage:
          !!first && !!built && Date.parse(built) > Date.parse(first),
      },
    },
    run: { chat, messages, snapshot },
    calls,
  };
}

/** The next case id of a kind on a day: `<date>-<kind>-<n>`, after the ones that exist. */
export function nextCaseId(
  existing: string[],
  date: string,
  kind: "map" | "chat",
): string {
  const prefix = `${date}-${kind}-`;
  const taken = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter(Number.isInteger);
  return `${prefix}${Math.max(0, ...taken) + 1}`;
}
