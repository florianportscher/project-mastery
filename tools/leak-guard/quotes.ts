import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * The quote check (issue #382): fingerprints of every 8-word window of the
 * real Materials' text live in the private cases repo, never in this repo.
 * A text that contains such a window quotes a real Material.
 */

const WINDOW = 8;

type Env = Record<string, string | undefined>;

const casesDir = (env: Env = process.env) =>
  env.MASTERY_CASES_DIR ?? path.join(homedir(), "project-mastery-cases");

export const fingerprintsFile = (env: Env = process.env) =>
  path.join(casesDir(env), "fingerprints.txt");

/** Lowercase letters and digits only: punctuation, markup and line breaks do not count. */
const WORDS = /[\p{L}\p{N}]+/gu;

const fingerprint = (words: string[]) =>
  createHash("sha256").update(words.join(" ")).digest("hex").slice(0, 16);

/** The fingerprint of every window of 8 consecutive words in the text. */
export function fingerprints(text: string): Set<string> {
  const words = text.toLowerCase().match(WORDS) ?? [];
  const found = new Set<string>();
  for (let i = 0; i + WINDOW <= words.length; i++) {
    found.add(fingerprint(words.slice(i, i + WINDOW)));
  }
  return found;
}

/** `file:line` of each added line of a unified diff that quotes a real Material. */
export function quotedDiffLines(diff: string, known: Set<string>) {
  const hits: string[] = [];
  let file = "";
  let line = 0;
  let header = false; // only between `diff --git` and the first `@@` are `+++ ` lines headers
  for (const text of diff.split("\n")) {
    if (text.startsWith("diff --git ")) header = true;
    else if (header && text.startsWith("+++ ")) {
      file = text.slice(4).replace(/^b\//, "");
    } else if (header && text.startsWith("--- ")) continue;
    else if (text.startsWith("@@")) {
      header = false;
      line = Number(/\+(\d+)/.exec(text)?.[1] ?? 1) - 1;
    } else if (!header && text.startsWith("+")) {
      line++;
      if (matchingLines(text.slice(1), known).length > 0) {
        hits.push(`${file}:${line}`);
      }
    }
  }
  return hits;
}

/** The 1-based lines of the text where a window starts that is a fingerprint. */
export function matchingLines(text: string, known: Set<string>): number[] {
  const words: { word: string; line: number }[] = [];
  text.split("\n").forEach((line, index) => {
    for (const word of line.toLowerCase().match(WORDS) ?? []) {
      words.push({ word, line: index + 1 });
    }
  });
  const lines = new Set<number>();
  for (let i = 0; i + WINDOW <= words.length; i++) {
    const window = words.slice(i, i + WINDOW);
    if (known.has(fingerprint(window.map((w) => w.word)))) {
      lines.add((window[0] as { line: number }).line);
    }
  }
  return [...lines].sort((a, b) => a - b);
}

const FINGERPRINTS_MISSING =
  "The fingerprints of the real Materials are missing, so the quote check cannot run. Make them with `pnpm leak-guard fingerprints` (reads staging, writes to the private cases repo).";

/** The stored fingerprints; throws, so the check fails closed, when they are missing. */
export function loadFingerprints(
  env: Record<string, string | undefined> = process.env,
) {
  const file = fingerprintsFile(env);
  if (!existsSync(file)) throw new Error(FINGERPRINTS_MISSING);
  return new Set(readFileSync(file, "utf8").split("\n").filter(Boolean));
}
