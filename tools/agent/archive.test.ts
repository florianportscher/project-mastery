import { describe, expect, it } from "vitest";
import { checkCasesRepo, type Flag, flagAction } from "./archive";

const mapFlag: Flag = {
  id: "f1",
  course_id: "c1",
  chat_id: null,
  note: "wrong",
  app_commit: "abc",
  finished_at: "2026-11-23T10:00:00+00:00",
};

describe("flagAction", () => {
  it("archives a map flag while the build is the flagged one", () => {
    expect(
      flagAction(mapFlag, {
        appCommit: "abc",
        finishedAt: "2026-11-23T10:00:00.000Z",
      }),
    ).toEqual({ action: "map", courseId: "c1" });
  });

  it("refuses a map flag after a rebuild", () => {
    expect(
      flagAction(mapFlag, {
        appCommit: "def",
        finishedAt: "2026-11-24T10:00:00Z",
      }).action,
    ).toBe("stale");
    expect(flagAction(mapFlag, null).action).toBe("stale");
  });

  it("archives a Chat flag whatever the build is", () => {
    expect(
      flagAction(
        { ...mapFlag, chat_id: "ch1", app_commit: null, finished_at: null },
        null,
      ),
    ).toEqual({ action: "chat", chatId: "ch1" });
  });

  it("reports a flag whose Course or Chat is gone as lost", () => {
    expect(flagAction({ ...mapFlag, course_id: null }, null).action).toBe(
      "lost",
    );
    expect(
      flagAction({ ...mapFlag, app_commit: null, finished_at: null }, null)
        .action,
    ).toBe("lost");
  });
});

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
