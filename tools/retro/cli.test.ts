import { describe, expect, it } from "vitest";
import {
  commandName,
  costByIssue,
  hasNoModelTurn,
  issueOfText,
  issuesOfCommand,
  roleOf,
  startCommand,
} from "./sessions";

const user = (content: string) => ({ type: "user", message: { content } });
const turn = { type: "assistant", message: { model: "m", usage: {} } };

describe("starting command", () => {
  it("keeps the arguments of the command", () => {
    const recs = [
      user(
        "<command-message>build</command-message>\n<command-name>/build</command-name>\n<command-args>335 336 337</command-args>",
      ),
    ];
    expect(startCommand(recs)).toBe("/build 335 336 337");
    expect(issuesOfCommand("/build 335 336 337")).toEqual([335, 336, 337]);
  });

  it("is free-form without a command", () => {
    expect(startCommand([user("hello")])).toBeUndefined();
    expect(commandName(undefined)).toBe("free-form");
    expect(commandName("/build 1")).toBe("/build");
    expect(issuesOfCommand("/sitting")).toEqual([]);
  });
});

describe("empty sessions", () => {
  it("has no model turn without an assistant usage record", () => {
    expect(hasNoModelTurn([user("hi")])).toBe(true);
    expect(hasNoModelTurn([user("hi"), turn])).toBe(false);
  });
});

describe("issue attribution", () => {
  it("reads the issue from a prompt or description", () => {
    expect(issueOfText(undefined, "Issue number: 335\nSlice 1")).toBe(335);
    expect(issueOfText("Build issue #336 slice 2")).toBe(336);
    expect(issueOfText("no number here")).toBeUndefined();
  });

  it("charges known agents to their issue and splits the rest evenly", () => {
    const by = costByIssue(
      [1, 2],
      [
        { role: "coordinator", cost: 1 },
        { role: "sonnet builders", cost: 3, issue: 2 },
      ],
    );
    expect(by.get(1)).toEqual({ coordinator: 0.5 });
    expect(by.get(2)).toEqual({ coordinator: 0.5, "sonnet builders": 3 });
  });

  it("tells roles apart", () => {
    const base = { models: "claude-sonnet-5-5" };
    expect(roleOf({ ...base, name: "main" })).toBe("coordinator");
    expect(roleOf({ ...base, name: "reviewer: Spec review" })).toBe(
      "reviewers",
    );
    expect(roleOf({ ...base, name: "builder: Finish 335" })).toBe("finish");
    expect(
      roleOf({ models: "claude-opus-5-5", name: "builder: Slice 1" }),
    ).toBe("opus builders");
    expect(roleOf({ ...base, name: "general-purpose: x" })).toBe("other");
  });
});
