import { describe, expect, it } from "vitest";
import {
  parseAllowlist,
  readAllowlist,
  sha256,
  unlistedDocuments,
  unlistedMaterials,
} from "./allowlist";

const bytes = new TextEncoder().encode("slide text");
const other = new TextEncoder().encode("changed");
const list = parseAllowlist(
  `# comment\nsrc/a b.pdf ${sha256(bytes)}\n\nnot a line\n`,
);
const file = (path: string, content: Uint8Array) => ({
  path,
  bytes: () => content,
});

describe("unlistedDocuments", () => {
  it("accepts a listed file", () => {
    expect(unlistedDocuments([file("src/a b.pdf", bytes)], list)).toEqual([]);
  });

  it("refuses a renamed listed file", () => {
    expect(unlistedDocuments([file("src/copy.pdf", bytes)], list)).toEqual([
      "src/copy.pdf",
    ]);
  });

  it("refuses a changed listed file", () => {
    expect(unlistedDocuments([file("src/a b.pdf", other)], list)).toEqual([
      "src/a b.pdf",
    ]);
  });

  it("checks every document type and ignores other files", () => {
    const paths = ["x.PPTX", "x.ppt", "x.docx", "x.doc", "x.key", "x.odp"];
    expect(
      unlistedDocuments(
        [...paths, "x.png", "x.md"].map((p) => file(p, bytes)),
        list,
      ),
    ).toEqual(paths);
  });
});

describe("unlistedMaterials", () => {
  it("matches by content, wherever the file lives", () => {
    expect(
      unlistedMaterials(
        [
          { name: "id1.pdf", bytes },
          { name: "id2.pdf", bytes: other },
        ],
        list,
      ),
    ).toEqual(["id2.pdf"]);
  });
});

it("lists the committed AI-written files", () => {
  expect(readAllowlist().entries.size).toBeGreaterThan(5);
});
