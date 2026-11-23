/**
 * What /garden asks of the repo:
 *
 *   pnpm -s garden [--areas N]           areas with their change and numbers; * marks the N it picks
 *   pnpm -s garden pick [--areas N]      the picked area names, one per line
 *   pnpm -s garden measure <area>... [--out file]
 *                                        all numbers of the areas as JSON
 *   pnpm -s garden write <before.json> <area>...
 *                                        measures again, records the run in docs/garden/ledger.json
 *                                        and writes the report skeleton docs/garden/<date>.md
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listAreas, type Area } from "./areas";
import {
  activeRejections,
  readLedger,
  recordRun,
  writeLedger,
  type Ledger,
  type Measure,
} from "./ledger";
import { measureAreas } from "./measure";
import { computeSizes, type SizeMetrics } from "./metrics";
import {
  changeOf,
  LOG_FORMAT,
  parseLog,
  pickAreas,
  type AreaStat,
} from "./pick";
import { reportSkeleton } from "./report";

const root = process.cwd();
const areas = listAreas(root);

function git(...args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
}

function statOf(area: Area, commit: string | undefined, loc: number) {
  let log = "";
  try {
    log = git(
      "log",
      "--no-renames",
      "--numstat",
      `--format=${LOG_FORMAT}`,
      ...(commit ? [`${commit}..HEAD`] : []),
      "--",
      ...area.paths,
    );
  } catch {
    commit = undefined;
  }
  return changeOf(area.name, parseLog(log), !commit, loc);
}

function stats(ledger: Ledger, sizes: Record<string, SizeMetrics>): AreaStat[] {
  return areas.map((a) =>
    statOf(a, ledger.areas[a.name]?.commit, sizes[a.name]!.loc),
  );
}

function areaCount(args: string[]): number {
  const at = args.indexOf("--areas");
  const n = at < 0 ? 2 : Number(args[at + 1]);
  if (!Number.isInteger(n) || n < 1) throw new Error("--areas needs a number.");
  return n;
}

function list(n: number) {
  const ledger = readLedger(root);
  const sizes = computeSizes(root, areas);
  const all = stats(ledger, sizes);
  const picked = new Set(pickAreas(all, n).map((s) => s.name));
  const changedSince = (file: string, sha: string) =>
    git("log", "--format=%H", `${sha}..HEAD`, "--", file).trim() !== "";
  for (const s of all) {
    const size = sizes[s.name]!;
    const entry = ledger.areas[s.name];
    const rejected = activeRejections(entry, changedSince).length;
    console.log(
      [
        picked.has(s.name) ? "*" : " ",
        s.name.padEnd(14),
        s.neverGardened
          ? "never gardened"
          : `since ${entry!.commit.slice(0, 7)}`,
        `change ${s.lines} lines in ${s.commits} commits`,
        `${size.files} files, ${size.loc} loc`,
        `${size.exports} exports (${size.usedOutside} used outside)`,
        entry
          ? `last run knip ${entry.measure.knip}, clones ${entry.measure.clones}, complex ${entry.measure.complex}, tests ${entry.measure.tests}`
          : "",
        rejected ? `${rejected} rejected` : "",
      ]
        .filter(Boolean)
        .join("  "),
    );
  }
}

async function main([command, ...args]: string[]) {
  if (command === undefined || command === "--areas") {
    list(areaCount(command ? [command, ...args] : args));
  } else if (command === "pick") {
    const all = stats(readLedger(root), computeSizes(root, areas));
    for (const s of pickAreas(all, areaCount(args))) console.log(s.name);
  } else if (command === "measure") {
    const out = args.indexOf("--out");
    const names =
      out < 0 ? args : args.filter((_, i) => i < out || i > out + 1);
    const result = JSON.stringify(
      await measureAreas(root, areas, names),
      null,
      2,
    );
    if (out < 0) console.log(result);
    else writeFileSync(args[out + 1]!, `${result}\n`);
  } else if (command === "write") {
    const [beforeFile, ...names] = args;
    if (!beforeFile || !names.length)
      throw new Error("Usage: write <before.json> <area>...");
    const before = JSON.parse(readFileSync(beforeFile, "utf8")) as Record<
      string,
      Measure
    >;
    const after = await measureAreas(root, areas, names);
    const date = new Date().toISOString().slice(0, 10);
    const commit = git("rev-parse", "HEAD").trim();
    let ledger = readLedger(root);
    for (const name of names) {
      ledger = recordRun(ledger, name, { commit, date, measure: after[name]! });
    }
    writeLedger(root, ledger);
    const report = path.join(root, "docs/garden", `${date}.md`);
    mkdirSync(path.dirname(report), { recursive: true });
    writeFileSync(
      report,
      reportSkeleton(
        date,
        names.map((name) => ({
          name,
          before: before[name]!,
          after: after[name]!,
        })),
      ),
    );
    console.log(`docs/garden/ledger.json and docs/garden/${date}.md written`);
  } else {
    console.error("Usage: pnpm -s garden [--areas N] | pick | measure | write");
    process.exit(1);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
