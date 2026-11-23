/**
 * What /garden asks of the repo (`pnpm garden` starts the routine itself):
 *
 *   pnpm -s garden:areas [--areas N]     areas with their change and numbers; * marks the N it picks
 *   pnpm -s garden:areas pick [--areas N]
 *                                        the picked area names, one per line
 *   pnpm -s garden:areas map <area>      the area's structure: modules, imports, cycles, files by change
 *   pnpm -s garden:areas measure <area>... [--out file]
 *                                        all numbers of the areas as JSON
 *   pnpm -s garden:areas write <before.json> <area>...
 *                                        measures again, records the run in docs/garden/ledger.json
 *                                        and writes the report skeleton docs/garden/<date>.md
 *   pnpm -s garden:areas reject <pr> <area> <change> <reason> <file>...
 *                                        records a change the maintainer rejected in a closed garden PR
 *   pnpm -s garden:areas rejected <area> the area's rejected changes whose files are unchanged
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listAreas, type Area } from "./areas";
import {
  activeRejections,
  addRejection,
  readLedger,
  recordRun,
  writeLedger,
  type Measure,
} from "./ledger";
import { renderMap } from "./map";
import { complexFunctions, measureAreas } from "./measure";
import { computeSizes, parseAreas, type SizeMetrics } from "./metrics";
import {
  changeOf,
  isGardenCommit,
  LOG_FORMAT,
  parseLog,
  pickAreas,
  sinceLastGarden,
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

const changedSince = (file: string, since: string) =>
  git("log", "--format=%H", `--since=${since}`, "--", file).trim() !== "";

function statOf(area: Area, loc: number) {
  const log = git(
    "log",
    "--no-renames",
    "--numstat",
    `--format=${LOG_FORMAT}`,
    "--",
    ...area.paths,
  );
  const since = sinceLastGarden(parseLog(log));
  return changeOf(area.name, since.commits, since.neverGardened, loc);
}

/** Lines changed per file of the area since its last garden. */
function changedFiles(area: Area): Record<string, number> {
  const log = git(
    "log",
    "--no-renames",
    "--numstat",
    `--format=${LOG_FORMAT}`,
    "--",
    ...area.paths,
  );
  const changed: Record<string, number> = {};
  for (const commit of sinceLastGarden(parseLog(log)).commits) {
    if (isGardenCommit(commit.subject)) continue;
    for (const { file, lines } of commit.files)
      changed[file] = (changed[file] ?? 0) + lines;
  }
  return changed;
}

function stats(sizes: Record<string, SizeMetrics>): AreaStat[] {
  return areas.map((a) => statOf(a, sizes[a.name]!.loc));
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
  const all = stats(sizes);
  const picked = new Set(pickAreas(all, n).map((s) => s.name));
  for (const s of all) {
    const size = sizes[s.name]!;
    const entry = ledger.areas[s.name];
    const rejected = activeRejections(ledger, s.name, changedSince).length;
    console.log(
      [
        picked.has(s.name) ? "*" : " ",
        s.name.padEnd(14),
        s.neverGardened
          ? "never gardened"
          : `since the last garden${entry ? ` (${entry.date})` : ""}`,
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
    const all = stats(computeSizes(root, areas));
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
  } else if (command === "map") {
    const area = areas.find((a) => a.name === args[0]);
    if (!area) throw new Error("Usage: map <area>");
    console.log(
      renderMap({
        area,
        areas,
        parsed: parseAreas(root, areas),
        changed: changedFiles(area),
        complex: await complexFunctions(root, area.paths),
      }),
    );
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
  } else if (command === "reject") {
    const [pr, area, change, reason, ...files] = args;
    if (!Number(pr) || !area || !change || !reason || !files.length)
      throw new Error("Usage: reject <pr> <area> <change> <reason> <file>...");
    if (!areas.some((a) => a.name === area))
      throw new Error(`No area ${area}.`);
    const at = new Date().toISOString();
    writeLedger(
      root,
      addRejection(readLedger(root), {
        area,
        change,
        reason,
        files,
        at,
        pr: Number(pr),
      }),
    );
    console.log(`Recorded in docs/garden/ledger.json: ${area}: ${change}`);
  } else if (command === "rejected") {
    const [area] = args;
    if (!area) throw new Error("Usage: rejected <area>");
    const active = activeRejections(readLedger(root), area, changedSince);
    if (!active.length) console.log(`No rejected changes in ${area}.`);
    for (const r of active)
      console.log(`- ${r.change} (${r.files.join(", ")}): ${r.reason}`);
  } else {
    console.error(
      "Usage: pnpm -s garden:areas [--areas N] | pick | map | measure | write | reject | rejected",
    );
    process.exit(1);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
