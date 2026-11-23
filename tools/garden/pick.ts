/**
 * Which areas changed most since their last garden: pure functions over the
 * text of `git log --numstat`, so tests need no repository.
 */
import { isExcluded } from "./areas";

export type Commit = {
  sha: string;
  subject: string;
  files: { file: string; lines: number }[];
};

export type AreaStat = {
  name: string;
  /** Lines added and deleted since the last garden, garden commits left out. */
  lines: number;
  commits: number;
  neverGardened: boolean;
};

/** Format string for `git log`, which `parseLog` reads. */
export const LOG_FORMAT = "@%H%x09%s";

/** A garden run commits with the scope `garden`: `refactor(garden): ...`. */
export function isGardenCommit(subject: string): boolean {
  return /^[a-z]+\(garden\)!?:/.test(subject);
}

/** Reads `git log --no-renames --numstat --format=LOG_FORMAT`. */
export function parseLog(text: string): Commit[] {
  const commits: Commit[] = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("@")) {
      const [sha = "", ...subject] = line.slice(1).split("\t");
      commits.push({ sha, subject: subject.join("\t"), files: [] });
      continue;
    }
    const [added, deleted, ...file] = line.split("\t");
    if (!file.length || !commits.length) continue;
    // A binary file counts "-" lines.
    const lines = (Number(added) || 0) + (Number(deleted) || 0);
    commits[commits.length - 1]!.files.push({ file: file.join("\t"), lines });
  }
  return commits;
}

/** The change of one area: what its commits touched, but code only. */
export function changeOf(
  name: string,
  commits: Commit[],
  neverGardened: boolean,
  loc: number,
): AreaStat {
  let lines = 0;
  let count = 0;
  for (const commit of commits) {
    if (isGardenCommit(commit.subject)) continue;
    const own = commit.files.filter((f) => !isExcluded(f.file));
    if (!own.length) continue;
    count++;
    lines += own.reduce((sum, f) => sum + f.lines, 0);
  }
  // Code never gardened is all of it to look at.
  return {
    name,
    lines: neverGardened ? Math.max(lines, loc) : lines,
    commits: count,
    neverGardened,
  };
}

/** The `n` areas with the most change; an area with none is skipped. */
export function pickAreas(stats: AreaStat[], n: number): AreaStat[] {
  return stats
    .filter((s) => s.lines > 0)
    .sort((a, b) => b.lines - a.lines || a.name.localeCompare(b.name))
    .slice(0, n);
}
