import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  fingerprints,
  loadFingerprints,
  matchingLines,
  quotedDiffLines,
} from "./quotes";

const material =
  "Die Eigenwerte einer Matrix sind die Nullstellen des charakteristischen Polynoms, wie gezeigt.";
const known = fingerprints(material);

describe("matchingLines", () => {
  it("finds a quoted window in another case, with other punctuation", () => {
    const text =
      "Intro\n> DIE EIGENWERTE einer Matrix – sind die Nullstellen des\nrest";
    expect(matchingLines(text, known)).toEqual([2]);
  });

  it("finds a window broken over lines and with umlauts normalised alike", () => {
    const umlauts = fingerprints(
      "Größe über Äpfel und Öl für alle Menschen hier sehr",
    );
    expect(
      matchingLines(
        "Größe über Äpfel\nund Öl für alle\nMenschen hier",
        umlauts,
      ),
    ).toEqual([1]);
  });

  it("ignores 7 shared words and unrelated text", () => {
    expect(
      matchingLines("Die Eigenwerte einer Matrix sind die Nullstellen", known),
    ).toEqual([]);
    expect(
      matchingLines("Nothing to see here at all, really none", known),
    ).toEqual([]);
  });
});

describe("quotedDiffLines", () => {
  it("finds a quote in an added line that starts with `++ `", () => {
    const diff = `diff --git a/n.md b/n.md\n--- a/n.md\n+++ b/n.md\n@@ -0,0 +1,2 @@\n+fine\n++ ${material}\n`;
    expect(quotedDiffLines(diff, known)).toEqual(["n.md:2"]);
  });
});

describe("loadFingerprints", () => {
  it("fails closed and names the command when the file is missing", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cases-"));
    expect(() => loadFingerprints({ MASTERY_CASES_DIR: dir })).toThrow(
      /pnpm leak-guard fingerprints/,
    );
  });
});

describe("the gh hook in guard-bash.sh", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "cases-"));
  writeFileSync(path.join(dir, "fingerprints.txt"), [...known].join("\n"));
  const body = path.join(dir, "body.md");
  writeFileSync(body, `Notes\n${material}\n`);
  const hook = path.join(
    import.meta.dirname,
    "../../.claude/hooks/guard-bash.sh",
  );

  const run = (command: string, cases = dir) =>
    spawnSync("bash", [hook], {
      input: JSON.stringify({
        tool_input: { command },
        cwd: path.join(import.meta.dirname, "../.."),
      }),
      env: { ...process.env, MASTERY_CASES_DIR: cases },
      encoding: "utf8",
      cwd: path.join(import.meta.dirname, "../.."),
    });

  it("refuses inline text that quotes a Material", () => {
    const result = run(`gh issue comment 5 --body "${material}"`);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/quotes 8 or more words/);
    expect(result.stderr).not.toMatch(/Eigenwerte/);
  });

  it("refuses a body file and a gh api field file", () => {
    expect(run(`gh pr create --title t --body-file ${body}`).status).toBe(2);
    expect(run(`gh api repos/x/y/issues -F body=@${body}`).status).toBe(2);
  });

  it("reads a relative body file from the command's directory and refuses an unreadable one", () => {
    const relative = run(
      `gh pr create --title t --body-file ${path.relative(path.join(import.meta.dirname, "../.."), body)}`,
    );
    expect(relative.status).toBe(2);
    expect(relative.stderr).toMatch(/quotes 8 or more words/);
    const missing = run(`gh pr create --title t --body-file nope/missing.md`);
    expect(missing.status).toBe(2);
    expect(missing.stderr).toMatch(/cannot read a body file/);
  });

  it("allows clean text and unrelated gh commands", () => {
    expect(run(`gh issue comment 5 --body "All fine here"`).status).toBe(0);
    expect(run(`gh issue view 5`).status).toBe(0);
  });

  it("fails closed when the fingerprints are missing", () => {
    const empty = mkdtempSync(path.join(tmpdir(), "cases-"));
    const result = run(`gh issue create --title t --body x`, empty);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/pnpm leak-guard fingerprints/);
  });
});
