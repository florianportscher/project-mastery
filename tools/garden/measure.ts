/**
 * The numbers per area that need other tools: knip findings, jscpd clones,
 * functions over the complexity threshold, test count and line coverage.
 * Each tool runs once for all areas asked; the `count*` functions split its
 * output by area.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { areaOf, isExcluded, type Area } from "./areas";
import type { Measure } from "./ledger";
import { parseComplexity, type ComplexFunction } from "./map";
import { computeSizes } from "./metrics";

/** Functions above this cyclomatic complexity count as complex. */
const COMPLEXITY = 10;

type Counts = Record<string, number>;

function eslintComplexity(targets: string[], root: string): Promise<string> {
  return run(
    [
      "pnpm",
      "exec",
      "eslint",
      ...targets,
      "--format",
      "json",
      "--rule",
      `complexity: [warn, ${COMPLEXITY}]`,
    ],
    root,
  );
}

/** The complex functions under the given paths, with their scores. */
export async function complexFunctions(
  root: string,
  paths: string[],
): Promise<ComplexFunction[]> {
  return parseComplexity(jsonOf(await eslintComplexity(paths, root)), (abs) =>
    path.relative(root, abs),
  ).filter(({ file }) => !isExcluded(file));
}

function run(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      args[0]!,
      args.slice(1),
      { cwd, maxBuffer: 1 << 29, env: { ...process.env, NO_COLOR: "1" } },
      // The tools exit non-zero when they find something: the output counts.
      (_error, stdout) => resolve(stdout),
    );
  });
}

function bump(counts: Counts, areas: Area[], file: string, by = 1) {
  const area = areaOf(areas, file);
  if (area && !isExcluded(file))
    counts[area.name] = (counts[area.name] ?? 0) + by;
}

export function countKnip(json: string, areas: Area[]): Counts {
  const counts: Counts = {};
  const { issues = [] } = JSON.parse(json) as {
    issues?: ({ file: string } & Record<string, unknown>)[];
  };
  for (const { file, ...kinds } of issues) {
    const found = Object.values(kinds).reduce<number>(
      (sum, v) => sum + (Array.isArray(v) ? v.length : 0),
      0,
    );
    bump(counts, areas, file, found);
  }
  return counts;
}

/** A clone counts once for each area one of its two sides lies in. */
export function countClones(json: string, areas: Area[]): Counts {
  const counts: Counts = {};
  const { duplicates = [] } = JSON.parse(json) as {
    duplicates?: {
      firstFile: { name: string };
      secondFile: { name: string };
    }[];
  };
  for (const { firstFile, secondFile } of duplicates) {
    const names = new Set(
      [firstFile.name, secondFile.name]
        .filter((file) => !isExcluded(file))
        .map((file) => areaOf(areas, file)?.name),
    );
    for (const name of names) if (name) counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function countComplex(json: string, areas: Area[], root: string): Counts {
  const counts: Counts = {};
  for (const { file } of parseComplexity(json, (abs) =>
    path.relative(root, abs),
  ))
    bump(counts, areas, file);
  return counts;
}

type Totals = { total: number; covered: number };

function countTests(json: string, areas: Area[], root: string): Counts {
  const tests: Counts = {};
  const { testResults = [] } = JSON.parse(json) as {
    testResults?: { name: string; assertionResults: unknown[] }[];
  };
  for (const { name, assertionResults } of testResults) {
    const area = areaOf(areas, path.relative(root, name));
    if (area)
      tests[area.name] = (tests[area.name] ?? 0) + assertionResults.length;
  }
  return tests;
}

function countCoverage(
  json: string,
  areas: Area[],
  root: string,
): Record<string, Totals> {
  const totals: Record<string, Totals> = {};
  const summary = JSON.parse(json) as Record<string, { lines: Totals }>;
  for (const [abs, { lines }] of Object.entries(summary)) {
    const file = path.relative(root, abs);
    const area = abs === "total" ? undefined : areaOf(areas, file);
    if (!area || isExcluded(file)) continue;
    const t = totals[area.name] ?? { total: 0, covered: 0 };
    totals[area.name] = {
      total: t.total + lines.total,
      covered: t.covered + lines.covered,
    };
  }
  return totals;
}

/** Measures the given areas; runs knip, jscpd, ESLint and Vitest once each. */
export async function measureAreas(
  root: string,
  all: Area[],
  names: string[],
): Promise<Record<string, Measure>> {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "garden-"));
  try {
    const chosen = all.filter((a) => names.includes(a.name));
    const sizes = computeSizes(root, all);
    const vitestJson = path.join(tmp, "vitest.json");
    const [knip, eslint] = await Promise.all([
      run(
        [
          "pnpm",
          "exec",
          "knip",
          "--no-progress",
          "--no-exit-code",
          "--no-config-hints",
          "--reporter",
          "json",
        ],
        root,
      ),
      eslintComplexity(["."], root),
    ]);
    await run(
      ["pnpm", "exec", "jscpd", "--reporters", "json", "--output", tmp],
      root,
    );
    await run(
      [
        "pnpm",
        "exec",
        "vitest",
        "run",
        ...chosen.flatMap((a) => a.paths),
        "--reporter=json",
        `--outputFile=${vitestJson}`,
        "--coverage",
        "--coverage.reporter=json-summary",
        `--coverage.reportsDirectory=${tmp}`,
        "--coverage.include=src/**",
        "--coverage.include=tools/**",
        "--coverage.reportOnFailure",
      ],
      root,
    );
    const read = (file: string) =>
      existsSync(file) ? readFileSync(file, "utf8") : undefined;
    const knipCounts = countKnip(jsonOf(knip), all);
    const eslintCounts = countComplex(jsonOf(eslint), all, root);
    const jscpd = read(path.join(tmp, "jscpd-report.json"));
    const cloneCounts = jscpd ? countClones(jscpd, all) : {};
    const testJson = read(vitestJson);
    const tests = testJson ? countTests(testJson, all, root) : {};
    const covJson = read(path.join(tmp, "coverage-summary.json"));
    const coverage = covJson ? countCoverage(covJson, all, root) : {};
    return Object.fromEntries(
      chosen.map((area) => {
        const c = coverage[area.name];
        return [
          area.name,
          {
            ...sizes[area.name]!,
            knip: knipCounts[area.name] ?? 0,
            clones: cloneCounts[area.name] ?? 0,
            complex: eslintCounts[area.name] ?? 0,
            tests: tests[area.name] ?? 0,
            coverage: c?.total ? Math.round((100 * c.covered) / c.total) : null,
          },
        ];
      }),
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** The JSON object or array in a tool's output, which may start with log lines. */
function jsonOf(out: string): string {
  const start = out.search(/^[[{]/m);
  return start < 0 ? "[]" : out.slice(start);
}
