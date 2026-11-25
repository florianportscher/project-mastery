import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import type { ArchivedCall, Manifest } from "./archive-bundle";
import { AgentError } from "./config";
import {
  type Call,
  flagLines,
  formatSection,
  SECTIONS,
  type Section,
  type Snapshot,
} from "./inspect";

/**
 * `pnpm case list | show <caseId> [section] | call <caseId> <callId>`: reads
 * the cases archived in the private cases repo (docs/agents/cases.md), as
 * text for analysis, from its files. `cite <caseId> <issue>…` records the
 * observation issues a case shows in its manifest and pushes the cases repo.
 */

type Env = Record<string, string | undefined>;

const casesRoot = (env: Env) =>
  path.join(
    env.MASTERY_CASES_DIR ?? path.join(homedir(), "project-mastery-cases"),
    "cases",
  );

type Case = {
  manifest: Manifest;
  run: Record<string, unknown>;
  calls: ArchivedCall[];
};

function loadCase(caseId: string, env: Env): Case {
  const dir = path.join(casesRoot(env), caseId);
  if (!existsSync(path.join(dir, "manifest.json")))
    throw new AgentError(`No case ${caseId} in ${casesRoot(env)}.`);
  const gz = (name: string) =>
    gunzipSync(readFileSync(path.join(dir, name))).toString("utf8");
  return {
    manifest: JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8")),
    run: JSON.parse(gz("run.json.gz")),
    calls: gz("calls.jsonl.gz")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ArchivedCall),
  };
}

const short = (id: string) => id.slice(0, 8);
const hhmm = (time: string) => new Date(time).toISOString().slice(11, 16);
const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}… (${text.length} chars)` : text;

/** The manifest's labels in a few lines. */
export function headerLines(m: Manifest): string[] {
  const materials = m.shape.materials;
  const pages = materials.reduce((sum, x) => sum + (x.pages ?? 0), 0);
  const languages = [
    ...new Set(materials.map((x) => x.language).filter(Boolean)),
  ];
  return [
    `case ${m.caseId} · ${m.kind} · ${m.course.name} (${m.course.id})`,
    `shape: ${materials.length} Materials, ${pages} pages, ${languages.join("/") || "language unknown"}`,
    `archived ${m.archivedAt} · code ${m.appCommits.join(", ") || "unknown"} · ${m.models.join(", ")} · ${m.calls.archived} calls (${m.calls.missing} missing) · $${m.cost.toFixed(4)}`,
    ...(m.observations.length > 0
      ? [`observations: ${m.observations.map((o) => `#${o}`).join(" ")}`]
      : []),
    ...(m.note ? [`note: ${m.note}`] : []),
  ];
}

type UiPart = {
  type: string;
  text?: string;
  input?: unknown;
  state?: string;
  errorText?: string;
};
type UiMessage = { role: string; created_at: string; parts?: UiPart[] };

/** A tool call in the transcript: an ask's Question in full, others clipped. */
function toolLine(part: UiPart): string {
  const name = part.type.slice("tool-".length);
  const input = (part.input ?? {}) as Record<string, unknown>;
  const failed =
    part.state === "output-error" ? ` FAILED ${part.errorText ?? ""}` : "";
  if (name === "ask" && typeof input.prompt === "string") {
    const kcs = Array.isArray(input.kcIds) ? input.kcIds.length : 0;
    return `  [ask, ${kcs} KCs]${failed}\n${input.prompt.replace(/^/gm, "    ")}`;
  }
  return `  [${name}]${failed} ${clip(JSON.stringify(input), 400)}`;
}

/**
 * A Chat as a transcript: each message with its time (UTC), the AI's text
 * and tool calls, and under each reply the ids of the model calls that made
 * it, for citing and replaying.
 */
export function transcript(
  messages: UiMessage[],
  calls: Array<Pick<ArchivedCall, "id" | "traceName" | "startTime">>,
): string[] {
  const replyCalls = calls.filter((c) => c.traceName === "chat-reply");
  const userTimes = messages
    .filter((m) => m.role === "user")
    .map((m) => Date.parse(m.created_at));
  const lines: string[] = [];
  for (const message of messages) {
    const at = Date.parse(message.created_at);
    const parts = message.parts ?? [];
    const text = parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("\n");
    if (message.role === "user") {
      lines.push(`${hhmm(message.created_at)} Student: ${text}`, "");
      continue;
    }
    const from = Math.max(...userTimes.filter((t) => t <= at), 0);
    const ids = replyCalls
      .filter((c) => {
        const t = Date.parse(c.startTime);
        return (
          t >= from &&
          t <= at + 5 * 60_000 &&
          !userTimes.some((u) => u > from && u <= t)
        );
      })
      .map((c) => short(c.id));
    lines.push(
      `${hhmm(message.created_at)} AI (${text.length} chars; calls ${ids.join(" ") || "none"}):`,
      text,
      ...parts.filter((p) => p.type.startsWith("tool-")).map(toolLine),
      "",
    );
  }
  return lines;
}

/** An archived call as `inspect` lists calls. */
function asCall(c: ArchivedCall): Call {
  const usage = c.usage as { input?: number; output?: number };
  return {
    id: c.id,
    name: c.traceName,
    model: c.model,
    startTime: c.startTime,
    endTime: c.endTime,
    level: c.level,
    statusMessage: c.statusMessage,
    inputTokens: usage.input ?? 0,
    outputTokens: usage.output ?? 0,
    cost: c.cost,
    metadata: Object.fromEntries(
      Object.entries(c.metadata).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  };
}

type GenAiPart = {
  type: string;
  content?: unknown;
  name?: string;
  arguments?: unknown;
  response?: unknown;
};
type GenAiMessage = { role: string; content?: unknown; parts?: GenAiPart[] };

const asJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

function partText(part: GenAiPart): string {
  if (part.type === "text" || part.type === "reasoning")
    return part.type === "reasoning"
      ? `(reasoning) ${String(part.content ?? "")}`
      : String(part.content ?? "");
  if (part.type === "tool_call")
    return `[call ${part.name}] ${JSON.stringify(part.arguments)}`;
  if (part.type === "tool_call_response")
    return `[result] ${clip(JSON.stringify(part.response), 2000)}`;
  return `[${part.type}] ${JSON.stringify(part)}`;
}

/** One archived call: its labels, prompt (system prompt by length only) and answer. */
export function callDetail(c: ArchivedCall): string[] {
  const input = asJson(c.input);
  const messages = (
    Array.isArray(input)
      ? input
      : ((input as { messages?: unknown })?.messages ?? [])
  ) as GenAiMessage[];
  const output = (asJson(c.output) ?? []) as GenAiMessage[];
  const render = (m: GenAiMessage) =>
    m.role === "system" && typeof m.content === "string"
      ? `--- system (${m.content.length} chars; the prompt in code at ${String(c.metadata.appCommit ?? "an unknown commit")})`
      : [
          `--- ${m.role}`,
          ...(m.parts ?? [{ type: "text", content: m.content }]).map(partText),
        ].join("\n");
  return [
    `call ${c.id} ${c.traceName} · ${c.model ?? "?"} · ${c.startTime} · $${(c.cost ?? 0).toFixed(4)} · ${c.level}${c.statusMessage ? ` ${c.statusMessage}` : ""}`,
    ...messages.map(render),
    "=== answer",
    ...(Array.isArray(output) ? output.map(render) : [String(output)]),
  ];
}

function list(env: Env): string {
  const root = casesRoot(env);
  if (!existsSync(root)) return `No cases in ${root}.`;
  return readdirSync(root)
    .toSorted()
    .map((id) => {
      const m = JSON.parse(
        readFileSync(path.join(root, id, "manifest.json"), "utf8"),
      ) as Manifest;
      const obs = m.observations.map((o) => `#${o}`).join(" ");
      const note = (m.note ?? "").split("\n")[0]!;
      return `${id}  ${m.course.name}  ${m.calls.archived} calls $${m.cost.toFixed(3)}${obs ? `  ${obs}` : ""}${note ? `  "${clip(note, 70)}"` : ""}`;
    })
    .join("\n");
}

function show(caseId: string, section: string | undefined, env: Env): string {
  const { manifest, run, calls } = loadCase(caseId, env);
  const header = headerLines(manifest);
  if (section === "calls")
    return [
      ...header,
      "",
      formatSection("calls", run.snapshot as Snapshot, calls.map(asCall)),
    ].join("\n");
  if (manifest.kind === "chat") {
    if (section)
      throw new AgentError(
        `A Chat case shows its transcript or "calls", not ${section}.`,
      );
    return [
      ...header,
      "",
      ...transcript(run.messages as UiMessage[], calls),
    ].join("\n");
  }
  const snapshot = run.snapshot as Snapshot;
  const mapCalls = calls.map(asCall);
  if (section) {
    if (!(SECTIONS as readonly string[]).includes(section))
      throw new AgentError(`Sections: ${SECTIONS.join(", ")}.`);
    return [
      ...header,
      "",
      formatSection(section as Section, snapshot, mapCalls),
    ].join("\n");
  }
  return [
    ...header,
    `\n== flags ==\n${flagLines(snapshot, mapCalls).join("\n")}`,
    ...SECTIONS.map(
      (x) => `\n== ${x} ==\n${formatSection(x, snapshot, mapCalls)}`,
    ),
  ].join("\n");
}

/** The observation numbers after citing `issues`: each once, in order. */
export function citedObservations(
  current: Array<string | number>,
  issues: string[],
): number[] {
  const numbers = issues.map((issue) => Number(issue.replace(/^#/, "")));
  if (numbers.some((n) => !Number.isInteger(n) || n <= 0))
    throw new AgentError(`Not issue numbers: ${issues.join(" ")}.`);
  return [...new Set([...current.map(Number), ...numbers])].toSorted(
    (a, b) => a - b,
  );
}

/** Records observation issues in a case's manifest and pushes the cases repo. */
function cite(caseId: string, issues: string[], env: Env): string {
  const file = path.join(casesRoot(env), caseId, "manifest.json");
  if (!existsSync(file)) throw new AgentError(`No case ${caseId}.`);
  const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest;
  const observations = citedObservations(manifest.observations, issues);
  if (observations.length === manifest.observations.length)
    return `${caseId} already cites ${observations.map((o) => `#${o}`).join(" ")}.`;
  writeFileSync(
    file,
    `${JSON.stringify({ ...manifest, observations }, null, 2)}\n`,
  );
  const repo = path.dirname(casesRoot(env));
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: repo, stdio: "ignore" });
  git(["add", path.relative(repo, file)]);
  git([
    "commit",
    "-q",
    "-m",
    `case ${caseId}: observations ${observations.map((o) => `#${o}`).join(" ")}`,
  ]);
  git(["push", "-q"]);
  return `${caseId} cites ${observations.map((o) => `#${o}`).join(" ")}; pushed.`;
}

const USAGE =
  "Usage: pnpm case list | show <caseId> [section|calls] | call <caseId> <callId> | cite <caseId> <issue>…";

export function caseCommand(args: string[], env: Env = process.env): string {
  const [what, caseId, more] = args;
  if (what === "list") return list(env);
  if (what === "show" && caseId) return show(caseId, more, env);
  if (what === "cite" && caseId && more)
    return cite(caseId, args.slice(2), env);
  if (what === "call" && caseId && more) {
    const found = loadCase(caseId, env).calls.filter((c) =>
      c.id.startsWith(more),
    );
    if (found.length !== 1)
      throw new AgentError(
        found.length === 0
          ? `No call ${more} in ${caseId}.`
          : `${more} names ${found.length} calls; give more of the id.`,
      );
    return callDetail(found[0]!).join("\n");
  }
  throw new AgentError(USAGE);
}
