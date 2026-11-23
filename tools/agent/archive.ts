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
import { queryStaging, stagingEnv } from "./staging";

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
    if (!existsSync(file)) writeFileSync(file, bytes);
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
): Promise<string> {
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
  return [
    `case ${caseId} pushed to the cases repo · ${calls.archived} calls${calls.missing ? `, ${calls.missing} missing` : ""} · ${materials} Materials in ${dirs.materials}`,
    ...Object.keys(files).map(
      (name) =>
        `  ${relative}/${name} ${statSync(path.join(dir, name)).size} bytes`,
    ),
    // Placeholder until `pnpm leak-guard` exists (#382): then refresh the quote fingerprints here.
    "quote fingerprints not refreshed",
  ].join("\n");
}

/** Archives a Course's current map build as a case. */
export function archiveCourse(
  courseId: string,
  note: string | null,
  env: Env = process.env,
): Promise<string> {
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
export function archiveChat(
  chatId: string,
  note: string | null,
  env: Env = process.env,
): Promise<string> {
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

const USAGE = 'Usage: pnpm archive <course|chat> <id> [--note "…"]';

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
  if (!id) throw new AgentError(USAGE);
  const note = values.note ?? null;
  if (kind === "course") return archiveCourse(id, note, env);
  if (kind === "chat") return archiveChat(id, note, env);
  throw new AgentError(USAGE);
}
