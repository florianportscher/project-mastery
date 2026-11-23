/**
 * Leak guards for real course Materials (issue #382). The git hooks call it:
 *
 *   pnpm -s leak-guard staged          pre-commit: staged document files
 *   pnpm -s leak-guard pushed          pre-push: reads git's ref lines on stdin
 *
 * A document file (PDF, PPTX, PPT, DOCX, DOC, KEY, ODP) that is added or
 * changed must be on `allowlist.txt` with its path and content hash.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readAllowlist, refusal, unlistedDocuments } from "./allowlist";

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

/** Every commit of each pushed ref that the remote does not have yet, file by file. */
function pushed() {
  const changed: Changed[] = [];
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
    }
  }
  refuseUnlisted(changed);
}

const command = process.argv[2];
if (command === "staged") staged();
else if (command === "pushed") pushed();
else {
  console.error("Usage: pnpm -s leak-guard staged | pushed");
  process.exitCode = 1;
}
