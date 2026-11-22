import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const doc = readFileSync(path.join(root, "docs/agents/commands.md"), "utf8");

/** Every inline code span of the doc: a command counts as documented when one starts with it. */
const spans = [...doc.matchAll(/`([^`\n]+)`/g)].map((match) => match[1] ?? "");

const scripts = Object.keys(
  (
    JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    }
  ).scripts,
);

const skills = readdirSync(path.join(root, ".claude/skills"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const startsWith = (span: string, head: string) =>
  span === head || span.startsWith(`${head} `);

describe("docs/agents/commands.md", () => {
  it.each(scripts)("lists the package.json script %s", (script) => {
    const heads = [`pnpm ${script}`, `pnpm -s ${script}`];
    expect(
      spans.some((span) => heads.some((head) => startsWith(span, head))),
      `Add a line for \`pnpm ${script}\` to docs/agents/commands.md`,
    ).toBe(true);
  });

  it.each(skills)("lists the slash skill /%s", (skill) => {
    expect(
      spans.some((span) => startsWith(span, `/${skill}`)),
      `Add a line for \`/${skill}\` to docs/agents/commands.md`,
    ).toBe(true);
  });
});
