import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { diffWalks, normalizeSnapshot } from "./walk-diff";

describe("normalizeSnapshot", () => {
  it("removes refs, ids, dates, times and the port", () => {
    const raw = [
      "http://localhost:3123/courses/0b9f1c1e-5a1d-4f55-9a43-0c1f2e3d4a5b/chat",
      '- button "New course" [ref=e8]',
      '- link "Linear Algebra I" [expanded=false, ref=e11]',
      '- StaticText "Created 2026-11-23T10:15:00.000Z, 3 minutes ago at 10:15 PM"',
    ].join("\n");
    expect(normalizeSnapshot(raw)).toBe(
      [
        "http://localhost:PORT/courses/<id>/chat",
        '- button "New course"',
        '- link "Linear Algebra I" [expanded=false]',
        '- StaticText "Created <date>, <ago> at <time>"',
      ].join("\n"),
    );
  });
});

describe("diffWalks", () => {
  const walk = (files: Record<string, string>) => {
    const dir = mkdtempSync(path.join(tmpdir(), "walk-"));
    for (const [name, text] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
      writeFileSync(path.join(dir, name), text);
    }
    return dir;
  };

  it("prints only the page count when the walks match", () => {
    const files = {
      "student/courses.txt": "a\n",
      "classmate/courses.txt": "b\n",
    };
    expect(diffWalks(walk(files), walk(files))).toBe("same: 2 pages");
  });

  it("prints the diff of a changed page and names a missing one", () => {
    const out = diffWalks(
      walk({ "student/courses.txt": "a\nb\n", "student/map.txt": "x\n" }),
      walk({ "student/courses.txt": "a\nc\n" }),
    );
    expect(out).toContain("-b");
    expect(out).toContain("+c");
    expect(out).toContain("student/map.txt: only in");
  });
});
