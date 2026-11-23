/**
 * The skeleton of a run's report, docs/garden/<date>.md, which is also the PR
 * body. The numbers are filled in; the sections the routine writes are not.
 */
import type { Measure } from "./ledger";

export type AreaRun = { name: string; before: Measure; after: Measure };

const COLUMNS: [string, (m: Measure) => string][] = [
  ["Files", (m) => String(m.files)],
  ["LOC", (m) => String(m.loc)],
  ["Exports (used outside)", (m) => `${m.exports} (${m.usedOutside})`],
  ["Knip", (m) => String(m.knip)],
  ["Clones", (m) => String(m.clones)],
  ["Complex functions", (m) => String(m.complex)],
  ["Tests", (m) => String(m.tests)],
  ["Coverage", (m) => (m.coverage === null ? "-" : `${m.coverage}%`)],
];

const pending = "_To write._";

export function reportSkeleton(date: string, areas: AreaRun[]): string {
  const cells = (a: AreaRun) =>
    COLUMNS.map(([, f]) => `${f(a.before)} -> ${f(a.after)}`);
  return [
    `# Garden ${date}`,
    "",
    "## Numbers",
    "",
    `| Area | ${COLUMNS.map(([name]) => name).join(" | ")} |`,
    `| --- |${COLUMNS.map(() => " --: |").join("")}`,
    ...areas.map((a) => `| ${a.name} | ${cells(a).join(" | ")} |`),
    "",
    "## Changes",
    "",
    "Per area and level (structure, seams, lines), one line each, saying why it is simpler.",
    "",
    pending,
    "",
    "## Examined and left",
    "",
    "Per area and level, each finding not changed, with the reason.",
    "",
    pending,
    "",
    "## Walk",
    "",
    pending,
    "",
    "## Tests changed or deleted",
    "",
    "Each with the reason.",
    "",
    pending,
    "",
    "## Assumptions checked",
    "",
    "Each assumption the break job listed, how it was checked and the outcome.",
    "",
    pending,
    "",
    "## Bugs fixed",
    "",
    "Each with its test's red and green output and a step to try on the preview.",
    "",
    pending,
    "",
    "## Rules added and issues filed",
    "",
    pending,
    "",
  ].join("\n");
}
