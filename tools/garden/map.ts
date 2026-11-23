/**
 * The structure of one area as text, for /garden's simplify job: its modules
 * (first folders), who imports what from whom inside and across areas, import
 * cycles, and per file its size, change since the last garden, importers and
 * complex functions. Pure, so tests need no repository.
 */
import { areaOf, type Area } from "./areas";
import type { ParsedFile } from "./metrics";

export type ComplexFunction = {
  file: string;
  line: number;
  name: string;
  score: number;
};

export type MapInput = {
  area: Area;
  areas: Area[];
  /** Parsed files of every area, so imports from outside show. */
  parsed: Map<string, ParsedFile>;
  /** Lines added and deleted per file since the area's last garden. */
  changed: Record<string, number>;
  complex: ComplexFunction[];
};

/**
 * The module of a file: the first folder under its area path, or the file
 * itself at the top, so entry files and shared types show as their own nodes.
 */
export function moduleOf(area: Area, file: string): string {
  const base = area.paths.find((p) => file === p || file.startsWith(`${p}/`));
  if (!base || file === base) return file;
  const [first, ...rest] = file.slice(base.length + 1).split("/");
  const name = rest.length ? `${first}/` : first!;
  return area.paths.length > 1 ? `${base}/${name}` : name;
}

/** Groups of two or more nodes that import each other in a ring. */
export function cycles(edges: Map<string, Set<string>>): string[][] {
  let index = 0;
  const order = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const found: string[][] = [];
  const visit = (node: string) => {
    order.set(node, index);
    low.set(node, index++);
    stack.push(node);
    onStack.add(node);
    for (const next of edges.get(node) ?? []) {
      if (!order.has(next)) {
        visit(next);
        low.set(node, Math.min(low.get(node)!, low.get(next)!));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node)!, order.get(next)!));
      }
    }
    if (low.get(node) === order.get(node)) {
      const group: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        group.push(member);
      } while (member !== node);
      if (group.length > 1) found.push(group.sort());
    }
  };
  for (const node of [...edges.keys()].sort())
    if (!order.has(node)) visit(node);
  return found;
}

const NAMES_SHOWN = 8;

function names(set: Set<string>): string {
  const all = [...set].sort();
  const shown = all.slice(0, NAMES_SHOWN).join(", ");
  return all.length > NAMES_SHOWN
    ? `${shown}, +${all.length - NAMES_SHOWN}`
    : shown;
}

function addEdge(
  edges: Map<string, Map<string, Set<string>>>,
  from: string,
  to: string,
  imported: string[],
) {
  const targets = edges.get(from) ?? new Map<string, Set<string>>();
  edges.set(from, targets);
  const set = targets.get(to) ?? new Set<string>();
  targets.set(to, set);
  for (const name of imported) set.add(name);
}

function edgeLines(edges: Map<string, Map<string, Set<string>>>): string[] {
  return [...edges]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([from, targets]) =>
      [...targets]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([to, set]) => `  ${from} -> ${to}: ${names(set)}`),
    );
}

export function renderMap({
  area,
  areas,
  parsed,
  changed,
  complex,
}: MapInput): string {
  const own = [...parsed.keys()]
    .filter((file) => areaOf(areas, file) === area)
    .sort();
  const ownSet = new Set(own);
  const mod = (file: string) => moduleOf(area, file);

  const fileEdges = new Map<string, Set<string>>();
  const moduleEdges = new Map<string, Map<string, Set<string>>>();
  const outgoing = new Map<string, Map<string, Set<string>>>();
  const incoming = new Map<string, Map<string, Set<string>>>();
  const importers = new Map<string, { inside: number; outside: number }>();
  for (const [file, { imports }] of parsed) {
    const inside = ownSet.has(file);
    for (const { target, names: imported } of imports) {
      const targetInside = ownSet.has(target);
      if (!inside && !targetInside) continue;
      if (inside && targetInside) {
        const set = fileEdges.get(file) ?? new Set<string>();
        set.add(target);
        fileEdges.set(file, set);
        if (mod(file) !== mod(target))
          addEdge(moduleEdges, mod(file), mod(target), imported);
      } else if (inside) {
        const to = areaOf(areas, target)?.name ?? target;
        addEdge(outgoing, mod(file), to, imported);
      } else {
        const from = areaOf(areas, file)?.name ?? file;
        addEdge(incoming, from, mod(target), imported);
      }
      if (targetInside) {
        const count = importers.get(target) ?? { inside: 0, outside: 0 };
        if (inside) count.inside++;
        else count.outside++;
        importers.set(target, count);
      }
    }
  }

  const complexOf = new Map<string, ComplexFunction[]>();
  for (const c of complex) {
    if (!ownSet.has(c.file)) continue;
    complexOf.set(c.file, [...(complexOf.get(c.file) ?? []), c]);
  }

  const modules = new Map<
    string,
    { files: number; loc: number; changed: number; complex: number }
  >();
  for (const file of own) {
    const m = modules.get(mod(file)) ?? {
      files: 0,
      loc: 0,
      changed: 0,
      complex: 0,
    };
    m.files++;
    m.loc += parsed.get(file)!.loc;
    m.changed += changed[file] ?? 0;
    m.complex += complexOf.get(file)?.length ?? 0;
    modules.set(mod(file), m);
  }

  const totalLoc = own.reduce((sum, f) => sum + parsed.get(f)!.loc, 0);
  const totalChanged = own.reduce((sum, f) => sum + (changed[f] ?? 0), 0);
  const moduleGraph = new Map(
    [...moduleEdges].map(([from, targets]) => [from, new Set(targets.keys())]),
  );
  const fileCycles = cycles(fileEdges);
  const moduleCycles = cycles(moduleGraph);

  const byChange = [...own].sort(
    (a, b) =>
      (changed[b] ?? 0) - (changed[a] ?? 0) ||
      parsed.get(b)!.loc - parsed.get(a)!.loc ||
      a.localeCompare(b),
  );

  return [
    `# ${area.name}: ${own.length} files, ${totalLoc} loc, ${totalChanged} lines changed since the last garden`,
    "",
    "## Modules (files, loc, changed lines, complex functions)",
    ...[...modules]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([name, m]) =>
          `  ${name}  ${m.files} files  ${m.loc} loc  ${m.changed} changed  ${m.complex} complex`,
      ),
    "",
    "## Imports between modules (names imported)",
    ...orNone(edgeLines(moduleEdges)),
    "",
    "## Imports from other areas",
    ...orNone(edgeLines(outgoing)),
    "",
    "## Imported by other areas",
    ...orNone(edgeLines(incoming)),
    "",
    "## Cycles",
    ...orNone([
      ...moduleCycles.map((c) => `  modules: ${c.join(" <-> ")}`),
      ...fileCycles.map((c) => `  files: ${c.join(" <-> ")}`),
    ]),
    "",
    "## Files by change (loc, changed lines, imported by files inside/outside, complex functions with score)",
    ...byChange.map((file) => {
      const count = importers.get(file) ?? { inside: 0, outside: 0 };
      const fns = (complexOf.get(file) ?? [])
        .sort((a, b) => b.score - a.score)
        .map((c) => `${c.name}:${c.line} ${c.score}`)
        .join(", ");
      return [
        `  ${file}`,
        `${parsed.get(file)!.loc} loc`,
        `${changed[file] ?? 0} changed`,
        `in ${count.inside}/${count.outside}`,
        fns,
      ]
        .filter(Boolean)
        .join("  ");
    }),
    "",
  ].join("\n");
}

function orNone(lines: string[]): string[] {
  return lines.length ? lines : ["  none"];
}

/** Reads ESLint's JSON output run with the `complexity` rule. */
export function parseComplexity(
  json: string,
  relative: (abs: string) => string,
): ComplexFunction[] {
  const files = JSON.parse(json) as {
    filePath: string;
    messages: { ruleId: string | null; line: number; message: string }[];
  }[];
  return files.flatMap(({ filePath, messages }) =>
    messages.flatMap((m) => {
      const match = /^(.*) has a complexity of (\d+)/.exec(m.message);
      if (m.ruleId !== "complexity" || !match) return [];
      return [
        {
          file: relative(filePath),
          line: m.line,
          // "Async function 'grade'" names it; "Arrow function" does not.
          name: /'(.+)'/.exec(match[1]!)?.[1] ?? match[1]!,
          score: Number(match[2]),
        },
      ];
    }),
  );
}
