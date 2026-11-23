import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { AgentError } from "./config";

const UUID =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const ISO_TIME =
  /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?/g;
const CLOCK = /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?\b/gi;
const AGO =
  /\b(?:\d+|a|an|about \d+)\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\b/gi;
const MONTH_DAY =
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}(?:, \d{4})?\b/g;

/**
 * Removes what differs between two walks of the same app: element refs, ids,
 * dates, times and the dev server's port.
 */
export function normalizeSnapshot(text: string) {
  return text
    .replace(/,? ?\bref=e\d+/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/localhost:\d+/g, "localhost:PORT")
    .replace(UUID, "<id>")
    .replace(ISO_TIME, "<date>")
    .replace(AGO, "<ago>")
    .replace(MONTH_DAY, "<date>")
    .replace(CLOCK, "<time>")
    .replace(/\[\s*,\s*/g, "[")
    .replace(/[ \t]+$/gm, "");
}

function listPages(dir: string, prefix = ""): string[] {
  return readdirSync(path.join(dir, prefix), { withFileTypes: true }).flatMap(
    (entry) =>
      entry.isDirectory()
        ? listPages(dir, path.join(prefix, entry.name))
        : [path.join(prefix, entry.name)],
  );
}

/** `same: N pages`, or the diff of each changed page. */
export function diffWalks(a: string, b: string) {
  for (const dir of [a, b])
    if (!existsSync(dir)) throw new AgentError(`No walk in ${dir}.`);
  const pages = [...new Set([...listPages(a), ...listPages(b)])].sort();
  const changes: string[] = [];
  for (const page of pages) {
    const left = existsSync(path.join(a, page))
      ? readFileSync(path.join(a, page), "utf8")
      : null;
    const right = existsSync(path.join(b, page))
      ? readFileSync(path.join(b, page), "utf8")
      : null;
    if (left === right) continue;
    if (left === null || right === null) {
      changes.push(`${page}: only in ${left === null ? b : a}`);
      continue;
    }
    const { stdout } = spawnSync(
      "diff",
      [
        "-u",
        "--label",
        `a/${page}`,
        "--label",
        `b/${page}`,
        path.join(a, page),
        path.join(b, page),
      ],
      { encoding: "utf8" },
    );
    changes.push(stdout.trimEnd());
  }
  return changes.length === 0
    ? `same: ${pages.length} pages`
    : changes.join("\n\n");
}
