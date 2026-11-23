import { describe, expect, it } from "vitest";
import { checkCasesRepo } from "./archive";

const dirs = {
  cases: "/home/a/project-mastery-cases",
  materials: "/home/a/mastery-materials",
};
const roots = ["/home/a/project-mastery"];

describe("checkCasesRepo", () => {
  it("lets a private origin outside the repo through", () => {
    expect(() => checkCasesRepo("PRIVATE", dirs, roots)).not.toThrow();
  });

  it("refuses a public origin", () => {
    expect(() => checkCasesRepo("PUBLIC", dirs, roots)).toThrow(
      /public, not private/,
    );
  });

  it("refuses a missing origin", () => {
    expect(() => checkCasesRepo(null, dirs, roots)).toThrow(/no GitHub origin/);
  });

  it("refuses a folder inside this repo", () => {
    expect(() =>
      checkCasesRepo(
        "PRIVATE",
        { ...dirs, materials: "/home/a/project-mastery/tmp/m" },
        roots,
      ),
    ).toThrow(/inside this repo/);
  });
});
