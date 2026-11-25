/**
 * Replays archived model calls of a case on a real model (docs/agents/cases.md):
 *
 *   pnpm replay <caseId> <callId>… [--prompt current|archived] [--model <id>]
 *
 * Each call is sent again with the data it sent then. `current` (the default)
 * builds it with this checkout's prompt, schema and settings; `archived`
 * keeps the system prompt the call had, so a replay shows the model's own
 * variance. It prints the archived and the new answer side by side with the
 * cost, and keeps the result in the case's `replays/` in the cases repo.
 * Map build calls and Chat replies can be replayed, not page reads.
 */
// Must come first: lets this script import features' `server.ts`.
import "./next-aliases";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { gunzipSync } from "node:zlib";
import { generateText, jsonSchema, tool, type ToolSet } from "ai";
import { chatReplySettings } from "@/features/chat/server";
import { MAP_CALL_REPLAYS } from "@/features/knowledge-map/server";
import { costUsd, tokenUsage } from "@/lib/ai/cost";
import { paceCall } from "@/lib/ai/pacing";
import {
  type Answer,
  archivedAnswer,
  type ArchivedCall,
  archivedPrompt,
  compareLine,
  offeredData,
  ReplayError,
  toModelMessages,
} from "./replay-call";

const USAGE =
  "Usage: pnpm replay <caseId> <callId>… [--prompt current|archived] [--model <id>]";

const casesDir = () =>
  process.env.MASTERY_CASES_DIR ??
  path.join(homedir(), "project-mastery-cases");

const git = (cwd: string, args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** This checkout's commit, marked `-dirty` with uncommitted changes. */
function codeVersion(): string {
  const root = path.resolve(import.meta.dirname, "..");
  const dirty = git(root, ["status", "--porcelain"]) !== "";
  return `${git(root, ["rev-parse", "--short", "HEAD"])}${dirty ? "-dirty" : ""}`;
}

function loadCalls(caseDir: string): ArchivedCall[] {
  const file = path.join(caseDir, "calls.jsonl.gz");
  if (!existsSync(file)) throw new ReplayError(`No case at ${caseDir}.`);
  return gunzipSync(readFileSync(file))
    .toString("utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ArchivedCall);
}

function findCall(calls: ArchivedCall[], prefix: string): ArchivedCall {
  const found = calls.filter((c) => c.id.startsWith(prefix));
  if (found.length === 1) return found[0]!;
  throw new ReplayError(
    found.length === 0
      ? `No call ${prefix} in this case.`
      : `${prefix} names ${found.length} calls; give more of the id.`,
  );
}

/** The tools as the call offered them, without `execute`: a tool call ends the step. */
function archivedTools(tools: ReturnType<typeof archivedPrompt>["tools"]) {
  return Object.fromEntries(
    tools.map((t) => [
      t.name,
      tool({
        description: t.description,
        inputSchema: jsonSchema(t.inputSchema),
      }),
    ]),
  ) as ToolSet;
}

type Mode = "current" | "archived";

/** What the replay sends for a call, and whether its instructions changed. */
function replayRequest(call: ArchivedCall, mode: Mode) {
  const prompt = archivedPrompt(call.input);
  let request: Record<string, unknown>;
  if (call.traceName in MAP_CALL_REPLAYS) {
    const build =
      MAP_CALL_REPLAYS[call.traceName as keyof typeof MAP_CALL_REPLAYS];
    try {
      request = build(offeredData(prompt.messages));
    } catch (error) {
      throw new ReplayError(
        `The current code cannot build this call from its archived data (${(error as Error).message}).`,
      );
    }
  } else if (call.traceName === "chat-reply") {
    request = {
      ...chatReplySettings(),
      messages: toModelMessages(prompt.messages),
      tools: archivedTools(prompt.tools),
    };
  } else {
    throw new ReplayError(
      `Replay covers map build calls (${Object.keys(MAP_CALL_REPLAYS).join(", ")}) and chat-reply, not ${call.traceName}.`,
    );
  }
  const instructionsChanged = request.instructions !== prompt.system;
  if (mode === "archived") request.instructions = prompt.system;
  return { request, instructionsChanged };
}

function newAnswer(result: Awaited<ReturnType<typeof generateText>>): Answer {
  let json: unknown = null;
  try {
    json = result.output ?? null;
  } catch {
    json = null;
  }
  return {
    text: result.text,
    toolCalls: result.toolCalls.map((c) => ({
      name: c.toolName,
      input: c.input,
    })),
    json,
  };
}

const show = (answer: Answer) =>
  [
    answer.text,
    ...answer.toolCalls.map(
      (c) => `[${c.name}] ${JSON.stringify(c.input, null, 2)}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");

async function replayOne(
  caseId: string,
  call: ArchivedCall,
  mode: Mode,
  modelOverride: string | undefined,
  version: string,
): Promise<{ lines: string[]; cost: number; record: object }> {
  const { request, instructionsChanged } = replayRequest(call, mode);
  const model =
    modelOverride ??
    (call.metadata["attributes.gen_ai.request.model"] as string | undefined) ??
    (request.model as string);
  await paceCall();
  const result = await generateText({
    ...(request as Parameters<typeof generateText>[0]),
    model,
    maxRetries: 2,
  });
  const before = archivedAnswer(call.output);
  const after = newAnswer(result);
  const cost = costUsd(model, tokenUsage(result.usage));
  const prompt =
    mode === "archived"
      ? "archived prompt"
      : instructionsChanged
        ? "current prompt (instructions changed since the archive)"
        : "current prompt (instructions as archived)";
  return {
    cost,
    lines: [
      `== ${call.id.slice(0, 8)} ${call.traceName} · ${model} · ${prompt} · $${cost.toFixed(4)}`,
      compareLine(before, after),
      "--- archived",
      show(before),
      "--- replay",
      show(after),
      "",
    ],
    record: {
      caseId,
      callId: call.id,
      traceName: call.traceName,
      model,
      prompt: mode,
      instructionsChanged,
      code: version,
      replayedAt: new Date().toISOString(),
      cost,
      usage: tokenUsage(result.usage),
      answer: after,
    },
  };
}

/** Keeps a replay in the case's `replays/` and pushes it to the cases repo. */
function keep(caseDir: string, records: object[]): string {
  const dir = path.join(caseDir, "replays");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
  const file = path.join(dir, `${stamp}.json`);
  writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`);
  const repo = casesDir();
  git(repo, ["add", path.relative(repo, file)]);
  git(repo, ["commit", "-q", "-m", `replay ${path.relative(repo, file)}`]);
  git(repo, ["push", "-q"]);
  return path.relative(repo, file);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      prompt: { type: "string", default: "current" },
      model: { type: "string" },
    },
  });
  const [caseId, ...prefixes] = positionals;
  const mode = values.prompt as Mode;
  if (
    !caseId ||
    prefixes.length === 0 ||
    !["current", "archived"].includes(mode)
  )
    throw new ReplayError(USAGE);
  const caseDir = path.join(casesDir(), "cases", caseId);
  const calls = loadCalls(caseDir);
  const chosen = prefixes.map((prefix) => findCall(calls, prefix));
  const version = codeVersion();
  const records: object[] = [];
  let total = 0;
  for (const call of chosen) {
    const { lines, cost, record } = await replayOne(
      caseId,
      call,
      mode,
      values.model,
      version,
    );
    console.log(lines.join("\n"));
    records.push(record);
    total += cost;
  }
  const done = `${chosen.length} call(s) replayed on code ${version}, $${total.toFixed(4)}`;
  // A mock answer says nothing about the prompt, so it is not kept.
  if (process.env.AI_PROVIDER === "mock") {
    console.log(`${done}; on the mock, so not kept.`);
    return;
  }
  console.log(`${done}; kept as ${keep(caseDir, records)} in the cases repo.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof ReplayError ? error.message : error);
  process.exit(1);
});
