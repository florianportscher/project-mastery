import { AgentError } from "./config";
import { queryStagingSql } from "./staging";

/**
 * `agent inspect`: a Course's stored map build and the model calls that made
 * it, as compact text, for diagnosing a wrong map (the developer view's
 * counterpart, issue #337). Reads the staging project only. It imports nothing
 * from `src/` (ADR 0015): the shapes and flag rules below repeat the app's.
 */

type Env = Record<string, string | undefined>;

export const SECTIONS = [
  "materials",
  "chunks",
  "units",
  "kcs",
  "exercises",
  "topics",
  "build",
  "calls",
] as const;
export type Section = (typeof SECTIONS)[number];

/** The parts of `course_build_snapshot` the sections print. */
export type Snapshot = {
  course: { id: string; name: string };
  materials: Array<{
    id: string;
    name: string;
    parseStatus: string;
    parseFailure: string | null;
    pagesTotal: number | null;
  }>;
  pages: Array<{
    materialId: string;
    pageNumber: number;
    skipped: string | null;
  }>;
  chunks: Array<{
    id: string;
    materialId: string;
    heading: string | null;
    position: number;
    label: string;
    pageFrom: number;
    pageTo: number;
    chars: number;
  }>;
  extractions: Array<{
    materialId: string;
    kind: string;
    batch: number;
    promptDigest: string | null;
    kcIds: string[] | null;
    createdAt?: string;
  }>;
  kcs: Array<{
    id: string;
    name: string;
    origin: string;
    assumes: unknown;
    retiredAt: string | null;
    sources: string[];
  }>;
  prerequisites: Array<{ from: string; to: string }>;
  exercises: Array<{
    id: string;
    position: number;
    difficulty: number;
    questionChunkIds: string[];
    solutionChunkIds: string[];
    examId: string | null;
    finalAnswers: unknown;
  }>;
  exams: Array<{
    id: string;
    name: string;
    position: number;
    confirmed: boolean | null;
    asked: boolean;
  }>;
  exerciseKcs: Array<{ exerciseId: string; kcId: string }>;
  topics: Array<{
    id: string;
    parentId: string | null;
    position: number;
    name: string;
    kcIds: string[];
  }>;
  build: {
    status: string;
    failureReason: string | null;
    startedAt: string;
    finishedAt: string | null;
    needsUpdate: boolean;
    appCommit?: string | null;
    checkReport: unknown;
  } | null;
};

/** One model call as the list shows it. */
export type Call = {
  id: string;
  name: string;
  model: string | null;
  startTime: string;
  endTime: string | null;
  level: string;
  statusMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  cost: number | null;
  metadata: Record<string, string>;
};

/** Langfuse's metadata key for the session a call ran in: a Chat's calls have one, the parse and build do not. */
const SESSION_KEY = "attributes.langfuse.session.id";

/**
 * Whether a call belongs to the current map build: made from its start to its
 * end (to now while it runs), outside any Chat session.
 */
export function inBuildWindow(
  call: { startTime: string; metadata?: Record<string, unknown> },
  build: Snapshot["build"],
  now = Date.now(),
): boolean {
  if (!build || call.metadata?.[SESSION_KEY]) return false;
  const start = Date.parse(call.startTime);
  return (
    start >= Date.parse(build.startedAt) &&
    start <= (build.finishedAt ? Date.parse(build.finishedAt) : now)
  );
}

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads the Course's snapshot through the read-only staging role. */
export async function fetchSnapshot(
  courseId: string,
  env: Env = process.env,
): Promise<Snapshot> {
  if (!UUID.test(courseId)) {
    throw new AgentError(`"${courseId}" is not a Course id (a UUID).`);
  }
  const out = await queryStagingSql(
    `select course_build_snapshot('${courseId}'::uuid) as snapshot`,
    env,
  );
  const row = out.split("\n")[0] ?? "";
  if (!row.startsWith("{")) throw new AgentError(`No snapshot: ${out}`);
  const snapshot = (JSON.parse(row) as { snapshot: Snapshot | null }).snapshot;
  if (!snapshot) throw new AgentError(`No Course ${courseId} on staging.`);
  return snapshot;
}

/** Langfuse's base URL and Basic auth from `.env.local`. */
function langfuse(env: Env) {
  const key = env.LANGFUSE_PUBLIC_KEY;
  const secret = env.LANGFUSE_SECRET_KEY;
  if (!key || !secret) return null;
  return {
    base: (env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com").replace(
      /\/+$/,
      "",
    ),
    auth: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    // Staging calls come from previews.
    environment: "preview",
  };
}

/** One page of the staging calls that match `filters`; null without Langfuse keys. */
export async function observations(
  env: Env,
  filters: object[],
  fields: string,
  cursor?: string,
  limit = 1000,
) {
  const lf = langfuse(env);
  if (!lf) return null;
  const url = new URL(`${lf.base}/api/public/v2/observations`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "filter",
    JSON.stringify([
      {
        type: "stringOptions",
        column: "environment",
        operator: "any of",
        value: [lf.environment],
      },
      ...filters,
    ]),
  );
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await fetch(url, { headers: { Authorization: lf.auth } });
  if (!response.ok) {
    throw new AgentError(
      `Langfuse returned ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
  return (await response.json()) as {
    data: Raw[];
    meta: { cursor?: string | null };
  };
}

/** One Langfuse observation, as far as the CLI reads it. */
export type Raw = {
  id: string;
  parentObservationId?: string | null;
  name?: string;
  model?: string | null;
  startTime: string;
  endTime?: string | null;
  level?: string;
  statusMessage?: string | null;
  usageDetails?: { input?: number; output?: number };
  totalCost?: number | null;
  metadata?: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
};

export function toCall(o: Raw): Call {
  const metadata = Object.fromEntries(
    Object.entries(o.metadata ?? {}).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  return {
    id: o.id,
    name: metadata["attributes.langfuse.trace.name"] ?? o.name ?? "",
    model: o.model ?? null,
    startTime: o.startTime,
    endTime: o.endTime ?? null,
    level: o.level ?? "DEFAULT",
    statusMessage: o.statusMessage || null,
    inputTokens: o.usageDetails?.input ?? 0,
    outputTokens: o.usageDetails?.output ?? 0,
    cost: o.totalCost ?? null,
    metadata,
  };
}

/**
 * The Course's calls, oldest first, each model call once (no tool spans, no
 * `embedMany` wrapper span); null when `.env.local` has no Langfuse keys.
 * At most 10 000, the newest; `truncated` when older ones were left out.
 */
async function fetchCalls(
  courseId: string,
  env: Env = process.env,
): Promise<{ calls: Call[]; truncated: boolean } | null> {
  const raws: Raw[] = [];
  let cursor: string | undefined;
  let truncated = false;
  for (let page = 0; ; page++) {
    if (page === 10) {
      truncated = true;
      break;
    }
    const response = await observations(
      env,
      [
        {
          type: "stringOptions",
          column: "type",
          operator: "any of",
          value: ["GENERATION", "EMBEDDING"],
        },
        {
          type: "stringObject",
          column: "metadata",
          key: "courseId",
          operator: "=",
          value: courseId,
        },
      ],
      "core,basic,usage,model,metadata",
      cursor,
    );
    if (!response) return null;
    raws.push(...response.data);
    cursor = response.meta.cursor ?? undefined;
    if (!cursor || response.data.length < 1000) break;
  }
  const parents = new Set(raws.map((o) => o.parentObservationId));
  const calls = raws
    .filter((o) => !parents.has(o.id))
    .map(toCall)
    .toSorted((a, b) => a.startTime.localeCompare(b.startTime));
  return { calls, truncated };
}

/** One call's input and output as text. */
async function fetchCallDetail(
  id: string,
  env: Env = process.env,
): Promise<string> {
  const response = await observations(
    env,
    [{ type: "string", column: "id", operator: "=", value: id }],
    "core,basic,usage,model,metadata,io",
    undefined,
    1,
  );
  if (!response) throw new AgentError(noKeys);
  const observation = response.data[0];
  if (!observation) throw new AgentError(`No call ${id} in Langfuse.`);
  const call = toCall(observation);
  return [
    describeCall(call),
    "",
    "INPUT",
    asText(observation.input),
    "",
    "OUTPUT",
    asText(observation.output),
  ].join("\n");
}

export const noKeys =
  "No Langfuse keys: set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY in .env.local.";

const asText = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

const short = (id: string) => id.slice(0, 8);

function describeCall(call: Call): string {
  const seconds = call.endTime
    ? `${((Date.parse(call.endTime) - Date.parse(call.startTime)) / 1000).toFixed(1)}s`
    : "?";
  const cost = call.cost === null ? "?" : `$${call.cost.toFixed(4)}`;
  const unit = call.metadata.unitKey ? ` unit ${call.metadata.unitKey}` : "";
  const error =
    call.level === "ERROR" ? ` ERROR ${call.statusMessage ?? ""}` : "";
  return `${call.id} ${call.startTime.slice(11, 19)} ${call.name} ${call.model ?? "-"} ${call.metadata.appCommit ?? "-"} ${seconds} ${call.inputTokens}>${call.outputTokens} tok ${cost}${unit}${error}`;
}

type Report = {
  uncitedPages: unknown[];
  unitsBelowCoverage: unknown[];
  unitsNotExtracted: string[];
  duplicates: Array<{ a: string; b: string }>;
};

function readReport(value: unknown): Report {
  const r = (value ?? {}) as Record<string, unknown>;
  const list = (key: string): unknown[] =>
    Array.isArray(r[key]) ? (r[key] as unknown[]) : [];
  return {
    uncitedPages: list("uncitedPages"),
    unitsBelowCoverage: list("unitsBelowCoverage"),
    unitsNotExtracted: list("unitsNotExtracted").filter(
      (x): x is string => typeof x === "string",
    ),
    duplicates: list("duplicates").filter(
      (x): x is { a: string; b: string } =>
        typeof (x as { a?: unknown })?.a === "string" &&
        typeof (x as { b?: unknown })?.b === "string",
    ),
  };
}

/** Suspect spots, one line each. Duplicates the app's flag rules in plain code. */
export function flagLines(s: Snapshot, calls: Call[] | null): string[] {
  const live = s.kcs.filter((kc) => !kc.retiredAt);
  const cited = new Set(live.flatMap((kc) => kc.sources));
  const lines: string[] = [];
  for (const c of s.chunks) {
    if (c.label === "content" && !cited.has(c.id))
      lines.push(
        `content chunk without KCs: ${c.heading ?? "no heading"} p${c.pageFrom}-${c.pageTo} (${short(c.id)})`,
      );
  }
  for (const kc of live.filter((k) => k.sources.length === 0))
    lines.push(`KC without sources: ${kc.name} (${short(kc.id)})`);
  const report = readReport(s.build?.checkReport);
  for (const d of report.duplicates)
    lines.push(`near-duplicate KCs: ${d.a} / ${d.b}`);
  for (const p of report.uncitedPages)
    lines.push(`report: pages without KCs: ${JSON.stringify(p)}`);
  for (const u of report.unitsBelowCoverage)
    lines.push(`report: unit below coverage: ${JSON.stringify(u)}`);
  for (const u of report.unitsNotExtracted)
    lines.push(`report: unit not extracted: ${u}`);
  const unread = s.pages.filter(
    (p) => p.skipped === "unreadable" || p.skipped === "uncovered",
  );
  if (unread.length > 0)
    lines.push(
      `unread pages: ${unread.map((p) => `${short(p.materialId)}:${p.pageNumber}`).join(" ")}`,
    );
  if (calls) {
    const last = new Map<string, Call>();
    for (const call of calls) {
      if (call.level === "ERROR")
        lines.push(`failed call: ${describeCall(call)}`);
      const unit = call.metadata.unitKey;
      if (!unit) continue;
      const before = last.get(`${call.name} ${unit}`);
      if (before) lines.push(`retried call: ${describeCall(before)}`);
      last.set(`${call.name} ${unit}`, call);
    }
  }
  return lines;
}

/** One section of the inspection as text. */
export function formatSection(
  section: Section,
  s: Snapshot,
  calls: Call[] | null,
): string {
  const kcName = new Map(s.kcs.map((kc) => [kc.id, kc.name]));
  const materialName = new Map(s.materials.map((m) => [m.id, m.name]));
  const name = (id: string) => `${kcName.get(id) ?? "?"} (${short(id)})`;
  const examName = new Map(s.exams.map((x) => [x.id, x.name]));
  const examLabel = (id: string | null) =>
    id ? ` exam "${examName.get(id) ?? short(id)}"` : "";
  const lines: string[] = [];
  switch (section) {
    case "materials":
      for (const m of s.materials) {
        const skipped = s.pages.filter(
          (p) => p.materialId === m.id && p.skipped,
        );
        const reasons = Object.entries(
          Object.groupBy(skipped, (p) => p.skipped!),
        )
          .map(([reason, pages]) => `${reason} ${pages!.length}`)
          .join(", ");
        lines.push(
          `${m.id} ${m.name} ${m.parseStatus} ${m.pagesTotal ?? "?"} pages${reasons ? ` (skipped: ${reasons})` : ""}${m.parseFailure ? ` FAILED ${m.parseFailure}` : ""}`,
        );
      }
      break;
    case "chunks":
      for (const m of s.materials) {
        lines.push(`# ${m.name}`);
        let heading: string | null | undefined;
        for (const k of s.chunks
          .filter((k) => k.materialId === m.id)
          .toSorted((a, b) => a.position - b.position)) {
          if (k.heading !== heading) lines.push(k.heading ?? "(no heading)");
          heading = k.heading;
          lines.push(
            `  - ${k.label} p${k.pageFrom}-${k.pageTo} ${k.chars} chars (${short(k.id)})`,
          );
        }
      }
      break;
    case "units":
      for (const e of s.extractions) {
        const key = `${e.materialId}/${e.kind}/${e.batch}`;
        const own = (calls ?? []).filter((c) => c.metadata.unitKey === key);
        lines.push(
          `${key} ${materialName.get(e.materialId) ?? "?"} ${e.kind} ${e.batch} prompt ${e.promptDigest?.slice(0, 8) ?? "none"}: ${(e.kcIds ?? []).map(name).join("; ") || "no KCs"}${own.length ? ` · calls ${own.map((c) => short(c.id)).join(" ")}` : ""}`,
        );
      }
      break;
    case "kcs":
      for (const kc of s.kcs) {
        const into = s.prerequisites.filter((p) => p.to === kc.id);
        const out = s.prerequisites.filter((p) => p.from === kc.id);
        lines.push(
          `${kc.id} ${kc.name} [${kc.origin}]${kc.retiredAt ? " RETIRED" : ""} sources ${kc.sources.map(short).join(",") || "none"} · requires ${into.map((p) => kcName.get(p.from) ?? short(p.from)).join(", ") || "-"} · required by ${out.map((p) => kcName.get(p.to) ?? short(p.to)).join(", ") || "-"} · assumes ${JSON.stringify(kc.assumes)}`,
        );
      }
      break;
    case "exercises":
      for (const x of s.exams)
        lines.push(
          `exam ${short(x.id)} "${x.name}" ${x.confirmed === null ? "unanswered" : x.confirmed ? "confirmed" : "rejected"}${x.asked ? ", asked" : ""}`,
        );
      for (const e of s.exercises) {
        lines.push(
          `#${e.position} ${short(e.id)} difficulty ${e.difficulty}${examLabel(e.examId)} question ${e.questionChunkIds.map(short).join(",")} solution ${e.solutionChunkIds.length > 0 ? e.solutionChunkIds.map(short).join(",") : "none"} KCs ${
            s.exerciseKcs
              .filter((x) => x.exerciseId === e.id)
              .map((x) => name(x.kcId))
              .join("; ") || "none"
          } answers ${JSON.stringify(e.finalAnswers)}`,
        );
      }
      break;
    case "topics": {
      const render = (parentId: string | null, depth: number) => {
        for (const t of s.topics
          .filter((t) => t.parentId === parentId)
          .toSorted((a, b) => a.position - b.position)) {
          lines.push(
            `${"  ".repeat(depth)}${t.name} (${short(t.id)}) KCs: ${t.kcIds.map(name).join("; ") || "-"}`,
          );
          render(t.id, depth + 1);
        }
      };
      render(null, 0);
      break;
    }
    case "build":
      lines.push(
        s.build
          ? `${s.build.status} commit ${s.build.appCommit ?? "-"} models ${
              [
                ...new Set(
                  (calls ?? [])
                    .filter((c) => inBuildWindow(c, s.build))
                    .flatMap((c) => (c.model ? [c.model] : [])),
                ),
              ].join(", ") || "-"
            } started ${s.build.startedAt} finished ${s.build.finishedAt ?? "-"}${s.build.needsUpdate ? " needs update" : ""}${s.build.failureReason ? ` FAILED ${s.build.failureReason}` : ""}`
          : "no build",
        JSON.stringify(s.build?.checkReport ?? null),
      );
      break;
    case "calls":
      if (calls === null) lines.push(noKeys);
      else if (calls.length === 0) lines.push("no calls traced");
      else lines.push(...calls.map(describeCall));
      break;
  }
  return lines.join("\n") || "(empty)";
}

/** `agent inspect <courseId> [section | call <id>]`. */
export async function inspect(
  args: string[],
  env: Env = process.env,
): Promise<string> {
  const [courseId, what, callId] = args;
  const usage = `Usage: agent inspect <courseId> [${SECTIONS.join("|")}]  or  agent inspect <courseId> call <callId>`;
  if (!courseId) throw new AgentError(usage);
  if (what === "call") {
    if (!callId) throw new AgentError(usage);
    return fetchCallDetail(callId, env);
  }
  if (what && !(SECTIONS as readonly string[]).includes(what))
    throw new AgentError(usage);
  const section = what as Section | undefined;
  const snapshot = await fetchSnapshot(courseId, env);
  let calls: Call[] | null = null;
  let callsNote = "";
  try {
    const fetched = await fetchCalls(courseId, env);
    calls = fetched?.calls ?? null;
    if (fetched?.truncated)
      callsNote = `only the newest ${fetched.calls.length} calls are shown`;
  } catch (error) {
    callsNote = `calls unavailable: ${error instanceof Error ? error.message : error}`;
  }
  if (section)
    return [callsNote, formatSection(section, snapshot, calls)]
      .filter(Boolean)
      .join("\n");
  // No section: flags first, then every section, headed.
  return [
    `Course ${snapshot.course.name} (${snapshot.course.id})`,
    ...(callsNote ? [callsNote] : []),
    `\n== flags ==\n${flagLines(snapshot, calls).join("\n")}`,
    ...SECTIONS.map(
      (x) => `\n== ${x} ==\n${formatSection(x, snapshot, calls)}`,
    ),
  ].join("\n");
}
