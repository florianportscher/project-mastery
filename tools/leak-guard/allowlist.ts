import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The allowlist of document files that may enter the public repo: one
 * `path sha256` line per file in `allowlist.txt`. A real course Material is
 * never on it (ADR on leak guards, issue #382).
 */

const DOCUMENT = /\.(pdf|pptx?|docx?|key|odp)$/i;

export const ALLOWLIST_FILE = path.join(import.meta.dirname, "allowlist.txt");

export type Allowlist = { entries: Set<string>; hashes: Set<string> };

const isDocument = (file: string) => DOCUMENT.test(file);

export const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

export function parseAllowlist(text: string): Allowlist {
  const entries = new Set<string>();
  const hashes = new Set<string>();
  for (const line of text.split("\n")) {
    const match = /^(\S.*?)\s+([0-9a-f]{64})\s*$/.exec(line);
    if (!match || line.startsWith("#")) continue;
    entries.add(`${match[1]} ${match[2]}`);
    hashes.add(match[2] as string);
  }
  return { entries, hashes };
}

export const readAllowlist = () =>
  parseAllowlist(readFileSync(ALLOWLIST_FILE, "utf8"));

/** The changed document files (path, content) that are not on the allowlist as that path with that content. */
export function unlistedDocuments(
  files: { path: string; bytes: () => Uint8Array }[],
  allowlist: Allowlist,
) {
  return files
    .filter((file) => isDocument(file.path))
    .filter(
      (file) => !allowlist.entries.has(`${file.path} ${sha256(file.bytes())}`),
    )
    .map((file) => file.path);
}

/** The Materials' files (by name) whose content is not on the allowlist, wherever the file lives. */
export function unlistedMaterials(
  files: { name: string; bytes: Uint8Array }[],
  allowlist: Allowlist,
) {
  return files
    .filter((file) => !allowlist.hashes.has(sha256(file.bytes)))
    .map((file) => file.name);
}

export function refusal(unlisted: string[]) {
  return [
    "Refused: document files that are not on the allowlist (tools/leak-guard/allowlist.txt):",
    ...unlisted.map((file) => `  ${file}`),
    "A real course Material must never enter the repo. For an AI-written file, add its line (`sha256sum <file>`) to the allowlist in the same commit.",
  ].join("\n");
}

/** Refuses a gold Course with a Material whose file is not on the allowlist. */
export function assertMaterialsListed(
  files: { name: string; bytes: Uint8Array }[],
) {
  const unlisted = unlistedMaterials(files, readAllowlist());
  if (unlisted.length > 0) {
    throw new Error(
      `${refusal(unlisted)}\nNothing was written. Gold Courses hold AI-written Materials only.`,
    );
  }
}
