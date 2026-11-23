import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";
import {
  type ArchivedMaterial,
  chatBundle,
  mapBundle,
  nextCaseId,
} from "./archive-bundle";
import { AgentError } from "./config";
import { fetchSnapshot, noKeys, observations, type Raw, UUID } from "./inspect";
import { queryStaging, stagingEnv, writeStaging } from "./staging";

/**
 * `pnpm archive course <courseId> [--note "…"]`: keeps a Course's current map
 * build on staging as a case in the private cases repo (issue #383,
 * docs/agents/cases.md, ADR 0035). Reads staging and Langfuse only, writes the
 * bundle and pushes it to the cases repo's `main`, and copies the Material
 * files to the materials folder outside both repos.
 */

type Env = Record<string, string | undefined>;

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

const casesDir = (env: Env) =>
  env.MASTERY_CASES_DIR ?? path.join(homedir(), "project-mastery-cases");
const materialsDir = (env: Env) =>
  env.MASTERY_MATERIALS_DIR ?? path.join(homedir(), "mastery-materials");

/** A path's real location, also for one that does not exist yet. */
function real(dir: string): string {
  const resolved = path.resolve(dir);
  return existsSync(resolved)
    ? realpathSync(resolved)
    : path.join(real(path.dirname(resolved)), path.basename(resolved));
}

const inside = (dir: string, root: string) => {
  const relative = path.relative(root, dir);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
};

/**
 * Refuses to write unless the cases repo's `origin` is private and the cases
 * and materials folders lie outside this repo's tree. `visibility` is what
 * `gh repo view` reported for `origin`, null when it has none.
 */
export function checkCasesRepo(
  visibility: string | null,
  dirs: { cases: string; materials: string },
  repoRoots: string[],
): void {
  for (const [name, dir] of Object.entries(dirs)) {
    const root = repoRoots.find((r) => inside(dir, r));
    if (root)
      throw new AgentError(
        `The ${name} folder ${dir} lies inside this repo (${root}). Point MASTERY_${name.toUpperCase()}_DIR outside it.`,
      );
  }
  if (visibility === null)
    throw new AgentError(
      `The cases repo ${dirs.cases} has no GitHub origin. Clone the private cases repo there.`,
    );
  if (visibility !== "PRIVATE")
    throw new AgentError(
      `The cases repo's origin is ${visibility.toLowerCase()}, not private. Nothing was written.`,
    );
}

/** The origin's visibility as `gh` reports it, null without a GitHub origin. */
function originVisibility(dir: string): string | null {
  try {
    return execFileSync(
      "gh",
      ["repo", "view", "--json", "visibility", "--jq", ".visibility"],
      { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return null;
  }
}

/** This repo's checkout and, for a worktree, the main checkout around it. */
function repoRoots(): string[] {
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  const common = git([
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
  ]);
  return [
    ...new Set([
      real(git(["rev-parse", "--show-toplevel"])),
      real(path.dirname(common)),
    ]),
  ];
}

/** Every row of a staging table query, 200 at a time. */
async function allRows<T>(query: string, env: Env): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 200) {
    const page = JSON.parse(
      await queryStaging(`${query}&limit=200&offset=${offset}`, env),
    ) as T[];
    rows.push(...page);
    if (page.length < 200) return rows;
  }
}

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Downloads each Material's file from staging storage, names it by its sha256
 * and copies it to the materials folder, once.
 */
async function copyMaterials(
  courseId: string,
  dir: string,
  env: Env,
): Promise<ArchivedMaterial[]> {
  const { url, secretKey } = stagingEnv(env);
  const rows = await allRows<{
    id: string;
    media_type: string;
    storage_path: string;
    pages_total: number | null;
    language: string | null;
  }>(
    `materials?course_id=eq.${courseId}&select=id,media_type,storage_path,pages_total,language&order=position`,
    env,
  );
  mkdirSync(dir, { recursive: true });
  const materials: ArchivedMaterial[] = [];
  for (const row of rows) {
    const response = await fetch(
      `${url}/storage/v1/object/course-files/${row.storage_path.split("/").map(encodeURIComponent).join("/")}`,
      { headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } },
    );
    if (!response.ok)
      throw new AgentError(
        `Staging storage returned ${response.status} for Material ${row.id}: ${(await response.text()).slice(0, 300)}`,
      );
    const bytes = Buffer.from(await response.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const file = path.join(
      dir,
      `${sha256}.${EXTENSIONS[row.media_type] ?? "bin"}`,
    );
    // The name is the hash of these bytes, so rewriting an existing file is harmless.
    writeFileSync(file, bytes);
    materials.push({
      id: row.id,
      sha256,
      mediaType: row.media_type,
      pagesTotal: row.pages_total,
      language: row.language,
    });
  }
  return materials;
}

/** Every model call in Langfuse that `filter` selects, with input and output. */
async function allObservations(filter: object, env: Env): Promise<Raw[]> {
  const raws: Raw[] = [];
  let cursor: string | undefined;
  do {
    const page = await observations(
      env,
      [
        {
          type: "stringOptions",
          column: "type",
          operator: "any of",
          value: ["GENERATION", "EMBEDDING"],
        },
        filter,
      ],
      "core,basic,usage,model,metadata,io",
      cursor,
      100,
    );
    if (!page) throw new AgentError(noKeys);
    raws.push(...page.data);
    cursor =
      page.data.length === 100 ? (page.meta.cursor ?? undefined) : undefined;
  } while (cursor);
  return raws;
}

const git = (dir: string, args: string[]) =>
  execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: "pipe" });

type Bundle = ReturnType<typeof mapBundle>;

/**
 * Checks the cases repo, reads what `collect` needs, then writes the bundle
 * it assembles as a case, commits and pushes it to the cases repo, and
 * returns the case id with the bundle's files and sizes.
 */
async function archiveCase(
  kind: "map" | "chat",
  env: Env,
  collect: (dirs: { materials: string }) => Promise<{
    courseName: string;
    materials: number;
    assemble: (caseId: string, archivedAt: string) => Bundle;
  }>,
): Promise<{ caseId: string; report: string }> {
  const dirs = {
    cases: real(casesDir(env)),
    materials: real(materialsDir(env)),
  };
  checkCasesRepo(
    existsSync(dirs.cases) ? originVisibility(dirs.cases) : null,
    dirs,
    repoRoots(),
  );
  const { courseName, materials, assemble } = await collect(dirs);

  const now = new Date();
  const root = path.join(dirs.cases, "cases");
  const caseId = nextCaseId(
    existsSync(root) ? readdirSync(root) : [],
    now.toISOString().slice(0, 10),
    kind,
  );
  const bundle = assemble(caseId, now.toISOString());
  const dir = path.join(root, caseId);
  mkdirSync(dir, { recursive: true });
  const files = {
    "manifest.json": `${JSON.stringify(bundle.manifest, null, 2)}\n`,
    "run.json.gz": gzipSync(JSON.stringify(bundle.run)),
    "calls.jsonl.gz": gzipSync(
      bundle.calls.map((c) => JSON.stringify(c)).join("\n"),
    ),
  };
  const relative = path.relative(dirs.cases, dir);
  try {
    for (const [name, content] of Object.entries(files))
      writeFileSync(path.join(dir, name), content);
    git(dirs.cases, ["add", "--", relative]);
    git(dirs.cases, [
      "commit",
      "--quiet",
      "-m",
      `case ${caseId}: ${courseName}`,
      "--",
      relative,
    ]);
    git(dirs.cases, ["push", "--quiet", "origin", "HEAD:main"]);
  } catch (error) {
    // A retry takes the same case id again; leave no half-written bundle behind.
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }

  const { calls } = bundle.manifest;
  const report = [
    `case ${caseId} pushed to the cases repo · ${calls.archived} calls${calls.missing ? `, ${calls.missing} missing` : ""} · ${materials} Materials in ${dirs.materials}`,
    ...Object.keys(files).map(
      (name) =>
        `  ${relative}/${name} ${statSync(path.join(dir, name)).size} bytes`,
    ),
    // Placeholder until `pnpm leak-guard` exists (#382): then refresh the quote fingerprints here.
    "quote fingerprints not refreshed",
  ].join("\n");
  return { caseId, report };
}

/** Archives a Course's current map build as a case. */
export async function archiveCourse(
  courseId: string,
  note: string | null,
  env: Env = process.env,
): Promise<string> {
  return (await courseCase(courseId, note, env)).report;
}

function courseCase(courseId: string, note: string | null, env: Env) {
  return archiveCase("map", env, async (dirs) => {
    const snapshot = await fetchSnapshot(courseId, env);
    const chunks = await allRows<{ id: string; markdown: string }>(
      `chunks?course_id=eq.${courseId}&select=id,markdown&order=id`,
      env,
    );
    const materials = await copyMaterials(courseId, dirs.materials, env);
    const observations = await allObservations(
      {
        type: "stringObject",
        column: "metadata",
        key: "courseId",
        operator: "=",
        value: courseId,
      },
      env,
    );
    return {
      courseName: snapshot.course.name,
      materials: materials.length,
      assemble: (caseId, archivedAt) =>
        mapBundle({
          caseId,
          note,
          archivedAt,
          snapshot,
          chunks,
          materials,
          observations,
        }),
    };
  });
}

/** Archives a Chat as a case: its messages, its Course's build and the calls of its session. */
async function archiveChat(
  chatId: string,
  note: string | null,
  env: Env = process.env,
): Promise<string> {
  return (await chatCase(chatId, note, env)).report;
}

function chatCase(chatId: string, note: string | null, env: Env) {
  if (!UUID.test(chatId))
    throw new AgentError(`"${chatId}" is not a Chat id (a UUID).`);
  return archiveCase("chat", env, async (dirs) => {
    const [chat] = await allRows<{ id: string; course_id: string }>(
      `chats?id=eq.${chatId}&select=*`,
      env,
    );
    if (!chat) throw new AgentError(`No Chat ${chatId} on staging.`);
    const messages = await allRows<{ created_at: string }>(
      `chat_messages?chat_id=eq.${chatId}&select=*&order=created_at`,
      env,
    );
    const snapshot = await fetchSnapshot(chat.course_id, env);
    const materials = await copyMaterials(chat.course_id, dirs.materials, env);
    const observations = await allObservations(
      {
        type: "string",
        column: "sessionId",
        operator: "=",
        value: chatId,
      },
      env,
    );
    return {
      courseName: snapshot.course.name,
      materials: materials.length,
      assemble: (caseId, archivedAt) =>
        chatBundle({
          caseId,
          note,
          archivedAt,
          snapshot,
          chat,
          messages,
          materials,
          observations,
        }),
    };
  });
}

/** A row of `developer_flags` as `archive flagged` reads it. */
export type Flag = {
  id: string;
  course_id: string | null;
  chat_id: string | null;
  note: string;
  app_commit: string | null;
  finished_at: string | null;
};

/** The Course's current build, as the snapshot reports it. */
export type CurrentBuild = {
  appCommit: string | null;
  finishedAt: string | null;
} | null;

/**
 * What to do with one unarchived flag: archive a Chat or the build it was sent
 * for, or skip it. A map build flag is refused when the Course's current
 * build is another one, so a rebuild is never archived under an old note.
 */
export function flagAction(
  flag: Flag,
  current: CurrentBuild,
):
  | { action: "chat"; chatId: string }
  | { action: "map"; courseId: string }
  | { action: "lost" }
  | { action: "stale"; reason: string } {
  if (!flag.course_id) return { action: "lost" };
  if (flag.chat_id) return { action: "chat", chatId: flag.chat_id };
  const time = (value: string | null) =>
    value === null ? null : Date.parse(value);
  const same =
    current !== null &&
    current.appCommit === flag.app_commit &&
    time(current.finishedAt) === time(flag.finished_at);
  if (!same)
    return {
      action: "stale",
      reason: current
        ? `the Course was rebuilt since (flagged commit ${flag.app_commit ?? "-"} finished ${flag.finished_at ?? "-"}, now commit ${current.appCommit ?? "-"} finished ${current.finishedAt ?? "-"})`
        : "the Course has no build any more",
    };
  return { action: "map", courseId: flag.course_id };
}

async function markFlag(id: string, caseId: string, env: Env): Promise<void> {
  await writeStaging(
    `PATCH developer_flags?id=eq.${id}`,
    JSON.stringify({ case_id: caseId }),
    env,
  );
}

/** One flag's line for the report, archiving it when it can be. */
async function archiveFlag(flag: Flag, env: Env): Promise<string> {
  const label = flag.chat_id
    ? `Chat ${flag.chat_id}`
    : `build of Course ${flag.course_id ?? "(deleted)"}`;
  const snapshot = flag.course_id
    ? await fetchSnapshot(flag.course_id, env)
    : null;
  const build = snapshot?.build;
  const todo = flagAction(
    flag,
    build
      ? { appCommit: build.appCommit ?? null, finishedAt: build.finishedAt }
      : null,
  );
  if (todo.action === "lost") {
    return `${label}: lost, its Course was deleted`;
  }
  if (todo.action === "stale") {
    const root = path.join(real(casesDir(env)), "cases");
    const would = nextCaseId(
      existsSync(root) ? readdirSync(root) : [],
      new Date().toISOString().slice(0, 10),
      "map",
    );
    return `${label}: not archived, ${todo.reason}. It would have been case ${would}.`;
  }
  const note = flag.note || null;
  const { caseId } =
    todo.action === "chat"
      ? await chatCase(todo.chatId, note, env)
      : await courseCase(todo.courseId, note, env);
  try {
    await markFlag(flag.id, caseId, env);
  } catch (error) {
    // The case is pushed: name it, so the flag can be set by hand.
    throw new Error(
      `case ${caseId} was archived but the flag was not marked (${error instanceof Error ? error.message : String(error)}); set developer_flags.case_id by hand`,
    );
  }
  return `${label}: case ${caseId}`;
}

/**
 * `pnpm archive flagged`: archives each developer flag that has no case yet,
 * with its note, and sets the flag's `case_id`. One line per flag.
 */
async function archiveFlagged(env: Env): Promise<string> {
  const flags = await allRows<Flag>(
    "developer_flags?case_id=is.null&select=id,course_id,chat_id,note,app_commit,finished_at&order=created_at",
    env,
  );
  if (flags.length === 0) return "no flagged runs waiting";
  const lines: string[] = [];
  for (const flag of flags) {
    try {
      lines.push(await archiveFlag(flag, env));
    } catch (error) {
      lines.push(
        `flag ${flag.id}: failed, ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return lines.join("\n");
}

const USAGE =
  'Usage: pnpm archive <course|chat> <id> [--note "…"] | pnpm archive flagged';

/** `pnpm archive course <courseId> [--note "…"]`, `pnpm archive chat <chatId> [--note "…"]`. */
export async function archive(
  args: string[],
  env: Env = process.env,
): Promise<string> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { note: { type: "string" } },
  });
  const [kind, id] = positionals;
  if (kind === "flagged") return archiveFlagged(env);
  if (!id) throw new AgentError(USAGE);
  const note = values.note ?? null;
  if (kind === "course") return archiveCourse(id, note, env);
  if (kind === "chat") return archiveChat(id, note, env);
  throw new AgentError(USAGE);
}
