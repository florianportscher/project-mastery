/**
 * Leak guards for real course Materials (issue #382). The git hooks call it:
 *
 *   pnpm -s leak-guard staged          pre-commit: staged document files
 *   pnpm -s leak-guard pushed          pre-push: reads git's ref lines on stdin
 *   pnpm -s leak-guard check-text      quote check of stdin (the gh hook)
 *   pnpm -s leak-guard fingerprints    rebuilds the fingerprints from staging
 *
 * A document file (PDF, PPTX, PPT, DOCX, DOC, KEY, ODP) that is added or
 * changed must be on `allowlist.txt` with its path and content hash. A push
 * must not add 8 consecutive words of a real Material (`quotes.ts`).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readAllowlist, refusal, unlistedDocuments } from "./allowlist";
import { writeFingerprints } from "./generate";
import { loadFingerprints, matchingLines } from "./quotes";

const ZERO = /^0+$/;

function git(...args: string[]) {
  return execFileSync("git", args, {
    encoding: "buffer",
    maxBuffer: 1 << 30,
  });
}

type Changed = { path: string; oid: string };

/** Added or modified files from `git diff-tree`/`git diff --raw -z` output. */
function parseRaw(raw: string): Changed[] {
  const parts = raw.split("\0");
  const changed: Changed[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const meta = (parts[i] ?? "").split(" ");
    const status = (meta[4] ?? "").charAt(0);
    if (status === "A" || status === "M" || status === "T") {
      changed.push({ path: parts[i + 1] as string, oid: meta[3] as string });
    }
  }
  return changed;
}

function refuseUnlisted(changed: Changed[]) {
  const unique = [...new Map(changed.map((c) => [c.path + c.oid, c])).values()];
  const unlisted = unlistedDocuments(
    unique.map((c) => ({
      path: c.path,
      bytes: () => git("cat-file", "blob", c.oid),
    })),
    readAllowlist(),
  );
  if (unlisted.length > 0) {
    console.error(refusal([...new Set(unlisted)]));
    process.exitCode = 1;
  }
}

function staged() {
  const raw = git(
    "diff",
    "--cached",
    "--raw",
    "--no-renames",
    "--no-abbrev",
    "-z",
  ).toString("utf8");
  refuseUnlisted(parseRaw(raw));
}

/** `file:line` of each added line of one commit that quotes a real Material. */
function quotedLines(commit: string, known: Set<string>) {
  const diff = git(
    "diff-tree",
    "-p",
    "-m",
    "--root",
    "--no-commit-id",
    "--no-renames",
    "-U0",
    commit,
  ).toString("utf8");
  const hits: string[] = [];
  let file = "";
  let line = 0;
  for (const text of diff.split("\n")) {
    if (text.startsWith("+++ ")) file = text.slice(4).replace(/^b\//, "");
    else if (text.startsWith("--- ")) continue;
    else if (text.startsWith("@@")) {
      line = Number(/\+(\d+)/.exec(text)?.[1] ?? 1) - 1;
    } else if (text.startsWith("+")) {
      line++;
      if (matchingLines(text.slice(1), known).length > 0) {
        hits.push(`${file}:${line}`);
      }
    }
  }
  return hits;
}

/** Every commit of each pushed ref that the remote does not have yet, file by file. */
function pushed() {
  const changed: Changed[] = [];
  const quoted = new Set<string>();
  const known = loadFingerprints();
  for (const line of readFileSync(0, "utf8").split("\n")) {
    const [, local, , remote] = line.split(" ");
    if (!local || ZERO.test(local)) continue;
    const range =
      !remote || ZERO.test(remote)
        ? [local, "--not", "--remotes"]
        : [`${remote}..${local}`];
    const commits = git("rev-list", ...range)
      .toString("utf8")
      .split("\n")
      .filter(Boolean);
    for (const commit of commits) {
      const raw = git(
        "diff-tree",
        "-r",
        "-m",
        "--root",
        "--no-commit-id",
        "--no-renames",
        "--no-abbrev",
        "-z",
        commit,
      ).toString("utf8");
      changed.push(...parseRaw(raw));
      for (const hit of quotedLines(commit, known)) quoted.add(hit);
    }
  }
  refuseUnlisted(changed);
  if (quoted.size > 0) {
    console.error(
      [
        "Refused: added lines that quote 8 or more words of a real Material:",
        ...[...quoted].map((hit) => `  ${hit}`),
        "Rewrite these lines in your own words; real Material text must not enter the public repo.",
      ].join("\n"),
    );
    process.exitCode = 1;
  }
}

/** The gh hook's check: the lines of stdin that quote a real Material. */
function checkText() {
  const lines = matchingLines(readFileSync(0, "utf8"), loadFingerprints());
  if (lines.length > 0) {
    console.error(
      `Refused: the text quotes 8 or more words of a real Material (line ${lines.join(", ")}). Rewrite those lines in your own words.`,
    );
    process.exitCode = 1;
  }
}

async function fingerprints() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const { courses, lines, file } = await writeFingerprints();
  console.log(
    `${lines} fingerprints from ${courses} Courses, written to ${file}`,
  );
}

async function main() {
  const command = process.argv[2];
  if (command === "staged") staged();
  else if (command === "pushed") pushed();
  else if (command === "check-text") checkText();
  else if (command === "fingerprints") await fingerprints();
  else {
    console.error(
      "Usage: pnpm -s leak-guard staged | pushed | check-text | fingerprints",
    );
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
