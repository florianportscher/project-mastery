/**
 * Pure helpers of the retro CLI: what started a session, which issue an
 * agent worked on, and which cost role it belongs to. They read parsed
 * transcript records and do no I/O, so tests can feed them fixture lines.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped transcript JSON
type Rec = Record<string, any>;

export type Role =
  | "coordinator"
  | "opus builders"
  | "sonnet builders"
  | "finish"
  | "reviewers"
  | "other";

export const ROLES: Role[] = [
  "coordinator",
  "opus builders",
  "sonnet builders",
  "finish",
  "reviewers",
  "other",
];

/** Built-in commands that change settings and do not start work. */
const SETTINGS_COMMANDS = new Set(["/model", "/clear", "/effort", "/config"]);

/** True when the session has no model turn: nothing was answered. */
export function hasNoModelTurn(recs: Rec[]): boolean {
  return !recs.some(
    (r) =>
      r.type === "assistant" &&
      r.message?.usage &&
      r.message.model !== "<synthetic>",
  );
}

/** The first command of the session with its arguments, e.g. `/build 335 336`. */
export function startCommand(recs: Rec[]): string | undefined {
  for (const r of recs) {
    if (r.type !== "user") continue;
    const c = r.message?.content;
    const text =
      typeof c === "string"
        ? c
        : Array.isArray(c)
          ? c.map((b: Rec) => b.text ?? "").join("\n")
          : "";
    const name = text.match(/<command-name>\s*(\S+?)\s*<\/command-name>/)?.[1];
    if (!name || SETTINGS_COMMANDS.has(name)) continue;
    const args =
      text.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1].trim() ?? "";
    return args ? `${name} ${args}` : name;
  }
  return undefined;
}

/** The command alone, or "free-form" when the session began with a plain message. */
export const commandName = (command: string | undefined): string =>
  command ? command.split(/\s+/)[0] : "free-form";

/** Issue numbers in the arguments of a `/build` command. */
export function issuesOfCommand(command: string | undefined): number[] {
  const m = command?.match(/^\/build\b(.*)$/);
  return m ? [...m[1].matchAll(/\d+/g)].map((n) => Number(n[0])) : [];
}

/** The issue a builder was given: `Issue number: 335`, `issue 335`, `issue #335`. */
export function issueOfText(
  ...texts: (string | undefined)[]
): number | undefined {
  for (const t of texts) {
    const n = t?.match(/\bissue(?: number)?:?\s*#?(\d+)/i)?.[1];
    if (n) return Number(n);
  }
  return undefined;
}

/** The cost role of one agent of a session. */
export function roleOf(agent: {
  name: string;
  models: string;
  prompt?: string;
}): Role {
  if (agent.name === "main") return "coordinator";
  const [type, ...rest] = agent.name.split(": ");
  const description = rest.join(": ");
  if (type === "reviewer") return "reviewers";
  if (type !== "builder") return "other";
  if (
    /\bfinish\b/i.test(description) ||
    /^\W*(the )?finish\b/i.test(agent.prompt ?? "")
  )
    return "finish";
  return agent.models.includes("opus") ? "opus builders" : "sonnet builders";
}

export type AgentCost = {
  role: Role;
  cost: number;
  /** The issue the agent worked on, when its prompt or description names one. */
  issue?: number;
};

/**
 * Cost per issue and role. An agent with a known issue charges it alone; any
 * other agent, the coordinator included, is split evenly between the session's
 * issues.
 */
export function costByIssue(
  sessionIssues: number[],
  agents: AgentCost[],
): Map<number, Partial<Record<Role, number>>> {
  const out = new Map<number, Partial<Record<Role, number>>>();
  const add = (issue: number, role: Role, cost: number) => {
    const row = out.get(issue) ?? {};
    row[role] = (row[role] ?? 0) + cost;
    out.set(issue, row);
  };
  for (const a of agents) {
    if (a.issue !== undefined) add(a.issue, a.role, a.cost);
    else
      for (const i of sessionIssues)
        add(i, a.role, a.cost / sessionIssues.length);
  }
  return out;
}
