// @vitest-environment node
import { asSchema } from "ai";
import { describe, expect, test, vi } from "vitest";
import type { z } from "zod";

vi.mock("server-only", () => ({}));
import {
  endsReply,
  tutorTools,
  type QuestionToGrade,
  type TutorToolActions,
} from "@/features/study/ai/tools";
import type { ReadingView } from "@/features/study/types";

/** The input limits the model meets, read off the tools themselves. */

const noActions = {
  getTopic: async () => null,
  findProblems: async () => ({ problems: [] }),
  remember: async () => {},
  ask: async () => ({ questionId: "q-1", problem: null }),
  findQuestion: async () => null,
  saveGrade: async () => null,
  closeQuestion: async () => false,
  findReading: async () => null,
  searchMaterials: async () => [],
  compute: async () => ({ ok: false, error: "unused" }),
} satisfies TutorToolActions;

const tools = tutorTools(noActions);

const accepts = (name: keyof typeof tools, input: unknown) =>
  (tools[name].inputSchema as z.ZodType).safeParse(input).success;

const kcIds = (n: number) => Array.from({ length: n }, (_, i) => `kc-${i}`);

describe.each([
  ["findProblems", 8],
  ["getTopic", 12],
] as const)("%s", (name, max) => {
  const input = (ids: string[]) =>
    name === "getTopic" ? { topicId: "t-1", kcIds: ids } : { kcIds: ids };
  test(`takes 1 to ${max} KCs`, () => {
    expect(accepts(name, input(kcIds(1)))).toBe(true);
    expect(accepts(name, input(kcIds(max)))).toBe(true);
    expect(accepts(name, input([]))).toBe(false);
    expect(accepts(name, input(kcIds(max + 1)))).toBe(false);
  });
});

describe("getTopic", () => {
  const read = (topic: unknown, input: Record<string, unknown>) =>
    tutorTools({ ...noActions, getTopic: async () => topic as never }).getTopic
      .execute!(input as never, { toolCallId: "1", messages: [] } as never);

  test("takes a Topic without KC ids, or with null", () => {
    expect(accepts("getTopic", { topicId: "t-1" })).toBe(true);
    expect(accepts("getTopic", { topicId: "t-1", kcIds: null })).toBe(true);
  });

  test("returns the Topic, and refuses an id outside the Course", async () => {
    const topic = { id: "t-1", name: "Thrust" };
    await expect(read(topic, { topicId: "t-1" })).resolves.toEqual(topic);
    await expect(read(null, { topicId: "x" })).rejects.toThrow(
      "x is no Topic id of this Course",
    );
  });

  test("reads KCs without a Topic, and then needs their ids", async () => {
    const calls: unknown[][] = [];
    const kcsOnly = { id: null, kcs: [{ id: "kc-1" }] };
    const run = tutorTools({
      ...noActions,
      getTopic: async (...args) => {
        calls.push(args);
        return kcsOnly as never;
      },
    }).getTopic.execute!;
    const options = { toolCallId: "1", messages: [] } as never;
    await expect(run({ kcIds: ["kc-1"] }, options)).resolves.toEqual(kcsOnly);
    expect(calls).toEqual([[null, ["kc-1"]]]);
    await expect(run({ topicId: null }, options)).rejects.toThrow(
      "Give a topicId, or the kcIds",
    );
  });
});

describe("searchMaterials", () => {
  const chunk = {
    chunkId: "c-1",
    material: "Lecture 1",
    pages: "p. 2",
    link: "/m/1#chunk-c-1",
    markdown: "Thrust",
  };
  const search = (found: (typeof chunk)[], query = "thrust") =>
    tutorTools({ ...noActions, searchMaterials: async () => found })
      .searchMaterials.execute!({ query }, {
      toolCallId: "1",
      messages: [],
    } as never);

  test("takes one line of at most 300 characters", () => {
    expect(accepts("searchMaterials", { query: "a".repeat(300) })).toBe(true);
    expect(accepts("searchMaterials", { query: "a".repeat(301) })).toBe(false);
    expect(accepts("searchMaterials", { query: "" })).toBe(false);
    expect(accepts("searchMaterials", { query: "a\nb" })).toBe(false);
  });

  test("returns the chunks as found", async () => {
    await expect(search([chunk])).resolves.toEqual({ chunks: [chunk] });
  });

  test("notes a Course without searchable chunks", async () => {
    await expect(search([])).resolves.toEqual({
      chunks: [],
      note: expect.stringContaining("No chunk"),
    });
  });
});

const openQuestion: QuestionToGrade = {
  id: "q-1",
  kcIds: ["kc-a", "kc-b"],
  retiredKcIds: [],
  parts: [
    { position: 1, kcId: "kc-a", hints: 0, solutionShown: false },
    { position: 2, kcId: "kc-b", hints: 0, solutionShown: false },
  ],
  answered: true,
  graded: false,
  sessionEnded: false,
  finalAnswers: null,
};

describe("grade", () => {
  const open = openQuestion;
  const saved: Array<Parameters<TutorToolActions["saveGrade"]>[0]> = [];
  const closed: string[] = [];

  /** The tools on the session's newest question `question`. */
  function toolsOn(question: QuestionToGrade | null) {
    saved.length = 0;
    closed.length = 0;
    return tutorTools({
      ...noActions,
      findQuestion: async () => question,
      saveGrade: async (input) => {
        saved.push(input);
        return [];
      },
      closeQuestion: async (id) => {
        closed.push(id);
        return true;
      },
    });
  }

  const options = { toolCallId: "1", messages: [] } as never;

  /** Results for parts 1, 2, … in order. */
  const results = (...verdicts: string[]) =>
    verdicts.map((result, index) => ({
      position: index + 1,
      result,
      note: `Note ${index + 1}`,
    }));

  /** Grades with `results` the session's newest question `question`. */
  async function grade(
    question: QuestionToGrade | null,
    given: Array<{ position: number; result: string }> = results(
      "full",
      "wrong",
    ),
    finalValues?: Array<{ label?: string; value: string }>,
  ) {
    return toolsOn(question).grade.execute!(
      { results: given, help: "some", finalValues } as never,
      options,
    );
  }

  test("stores each part's result and note, and one Attempt per KC", async () => {
    await expect(grade(open)).resolves.toMatchObject({
      questionId: "q-1",
      parts: results("full", "wrong"),
    });
    expect(saved).toEqual([
      expect.objectContaining({
        questionId: "q-1",
        parts: results("full", "wrong"),
        results: [
          expect.objectContaining({ kcId: "kc-a", result: "full" }),
          expect.objectContaining({ kcId: "kc-b", result: "wrong" }),
        ],
      }),
    ]);
  });

  test("a KC's Attempt is its worst answered part; a KC with only unanswered parts gets none", async () => {
    const parts = [1, 2, 3].map((position) => ({
      ...openQuestion.parts[0]!,
      position,
      kcId: position < 3 ? "kc-a" : "kc-b",
    }));
    await grade({ ...open, parts }, results("full", "partial", "unanswered"));
    const worst = () => saved[0]?.results.map((r) => [r.kcId, r.result]);
    expect(worst()).toEqual([["kc-a", "partial"]]);
    await grade({ ...open, parts }, results("unanswered", "wrong", "full"));
    expect(worst()).toEqual([
      ["kc-a", "wrong"],
      ["kc-b", "full"],
    ]);
  });

  test("after a grade whose reply failed, the next message's grade says the grade is recorded and to write the reply from it", async () => {
    await grade(open);
    // The reply failed (429) after the grade was stored; the next message
    // finds the Question graded.
    await expect(grade({ ...open, graded: true })).rejects.toThrow(
      /already graded.*recorded.*reply/,
    );
    expect(saved).toEqual([]);
  });

  test("closeQuestion closes the open question without attempts", async () => {
    await expect(
      toolsOn({ ...open, answered: false }).closeQuestion.execute!({}, options),
    ).resolves.toEqual({ ok: true });
    expect(closed).toEqual(["q-1"]);
    expect(saved).toEqual([]);
  });

  test.each([
    ["no question", null, "no open Question"],
    ["a graded one", { ...open, graded: true }, "already graded"],
    [
      "one from an ended session",
      { ...open, sessionEnded: true },
      "session has ended",
    ],
  ])("closeQuestion refuses %s", async (_, question, message) => {
    await expect(
      toolsOn(question).closeQuestion.execute!({}, options),
    ).rejects.toThrow(message);
    expect(closed).toEqual([]);
  });

  test("grade's schema requires results and help", async () => {
    // With every field optional and a noAnswer flag, MiMo sent finalValues
    // without results in 4 of 4 replays of a staging reply (2026-11-09).
    const schema = await asSchema(toolsOn(open).grade.inputSchema).jsonSchema;
    expect(schema).toMatchObject({ required: ["results", "help"] });
  });

  test("grades the parts of KCs retired since the ask, without Attempts", async () => {
    await grade({ ...open, kcIds: ["kc-a"], retiredKcIds: ["kc-b"] });
    expect(saved[0]?.results).toEqual([
      expect.objectContaining({ kcId: "kc-a", result: "full" }),
    ]);
    await grade({ ...open, kcIds: [], retiredKcIds: ["kc-a", "kc-b"] });
    expect(saved[0]).toMatchObject({
      parts: results("full", "wrong"),
      results: [],
    });
  });

  test.each([
    ["no question", null, undefined, "no open Question"],
    [
      "an unanswered one",
      { ...open, answered: false },
      undefined,
      "not answered",
    ],
    ["a graded one", { ...open, graded: true }, undefined, "already graded"],
    [
      "one from an ended session",
      { ...open, sessionEnded: true },
      undefined,
      "session has ended",
    ],
    [
      "a part the question doesn't have",
      open,
      results("full", "full", "full"),
      "each part of the question, by its position, each once: 1, 2",
    ],
    ["a missing part", open, results("full"), "each part of the question"],
    [
      "a part twice",
      open,
      [
        { position: 1, result: "full", note: "" },
        { position: 1, result: "wrong", note: "" },
      ],
      "each once",
    ],
  ])("refuses %s", async (_, question, given, message) => {
    await expect(grade(question, given)).rejects.toThrow(message);
    expect(saved).toEqual([]);
  });

  test("grades a question without parts per KC, as before parts", async () => {
    const legacy = { ...open, parts: [] };
    await expect(grade(legacy, results("full"))).rejects.toThrow("2 is KC id");
    await grade(legacy, results("full", "wrong"));
    expect(saved[0]).toMatchObject({ parts: [] });
    expect(saved[0]?.results.map((r) => r.kcId)).toEqual(["kc-a", "kc-b"]);
  });

  describe("the answer check", () => {
    const key = (label: string, value: string) => ({
      label,
      value,
      anyOrder: false,
    });
    const thrust: QuestionToGrade = {
      ...open,
      finalAnswers: [key("Thrust", "17.5 kN")],
    };
    const two: QuestionToGrade = {
      ...open,
      finalAnswers: [key("A", "[[1, 2], [0, 1]]"), key("b", "n + 1")],
    };
    const partial = results("partial", "wrong");

    test.each([
      ["one unlabelled value", thrust, [{ value: "17500 N" }], "match"],
      [
        "each key by label",
        two,
        [
          { label: "A", value: "[[1, 2], [0, 1]]" },
          { label: "B", value: "1 + n" },
        ],
        "match",
      ],
      [
        "the worst check",
        two,
        [
          { label: "A", value: "[[1, 2], [0, 1]]" },
          { label: "b", value: "n" },
        ],
        "mismatch",
      ],
      [
        "a value code doesn't compare",
        thrust,
        [{ value: "true" }],
        "unchecked",
      ],
    ])("stores %s as %s", async (_, question, finalValues, check) => {
      await grade(question, undefined, finalValues);
      expect(saved[0]?.check).toBe(check);
    });

    test("a mismatch turns a full part into partial; a match keeps the verdict", async () => {
      const stored = (value: string) =>
        grade(thrust, undefined, [{ value }]).then(() =>
          saved[0]?.parts.map(({ result }) => result),
        );
      expect(await stored("20 kN")).toEqual(["partial", "wrong"]);
      expect(await stored("17.5 kN")).toEqual(["full", "wrong"]);
    });

    test("is null without keys, and unchecked for a key without a value", async () => {
      await grade(open, undefined, [{ value: "17.5 kN" }]);
      expect(saved[0]?.check).toBeNull();
      await grade(thrust, partial);
      expect(saved[0]?.check).toBe("unchecked");
    });

    test("refuses a full while a key has no value", async () => {
      await expect(
        grade(two, undefined, [{ label: "A", value: "[[1, 2], [0, 1]]" }]),
      ).rejects.toThrow('give it in finalValues for "b"');
      expect(saved).toEqual([]);
    });

    test("refuses an unknown label and a value mathjs can't read", async () => {
      await expect(
        grade(two, partial, [{ label: "c", value: "1" }]),
      ).rejects.toThrow("A, b");
      await expect(
        grade(thrust, partial, [{ value: "17.5 kN)" }]),
      ).rejects.toThrow("mathjs");
      expect(saved).toEqual([]);
    });
  });
});

describe("showReading", () => {
  const section = {
    label: "Lecture 3, pp. 12–14",
    chunks: ["Thrust is $F = \\dot m \\Delta v$."],
  };
  const show = (found: ReadingView | null) =>
    tutorTools({ ...noActions, findReading: async () => found }).showReading
      .execute!({ sectionId: "s-1", purpose: "What makes thrust?" }, {
      toolCallId: "1",
      messages: [],
    } as never);

  test("refuses a section that is no Reading section of the Course", async () => {
    await expect(show(null)).rejects.toThrow(
      "s-1 is no Reading section of this Course",
    );
  });

  test("returns the label and chunks", async () => {
    expect(await show(section)).toEqual(section);
  });

  test("takes a purpose of one line of at most 300 characters", () => {
    const purpose = (value: string) =>
      accepts("showReading", { sectionId: "s-1", purpose: value });
    expect(purpose("x".repeat(300))).toBe(true);
    expect(purpose("")).toBe(false);
    expect(purpose("x".repeat(301))).toBe(false);
    expect(purpose("Why?\nHow?")).toBe(false);
  });

  test.each(["showReading", "ask"])("a %s call ends the reply", (toolName) => {
    const step = (name: string) => ({ toolCalls: [{ toolName: name }] });
    expect(endsReply({ steps: [step(toolName)] } as never)).toBe(true);
    expect(endsReply({ steps: [step("getTopic")] } as never)).toBe(false);
  });
});

describe("ask", () => {
  const problem = {
    statement: "Compute it.",
    page: null,
    generatedProblemId: "p-1",
  };
  const askWith = (
    posed: typeof problem | null,
    newest: QuestionToGrade | null = null,
  ) =>
    tutorTools({
      ...noActions,
      findQuestion: async () => newest,
      ask: async () => ({ questionId: "q-2", problem: posed }),
    }).ask.execute!(
      {
        prompt: "Go.",
        parts: [
          { prompt: "Name it.", kcId: "k1", form: "short", options: null },
        ],
        problemId: "p-1",
      },
      { toolCallId: "1", messages: [] } as never,
    );

  test("takes 1 to 6 parts, each short or long", () => {
    const part = {
      prompt: "Name it.",
      kcId: "k1",
      form: "short",
      options: null,
    };
    const parts = (n: number, form = "short") =>
      accepts("ask", {
        prompt: "Case.",
        parts: Array.from({ length: n }, () => ({ ...part, form })),
      });
    expect(parts(1)).toBe(true);
    expect(parts(6, "long")).toBe(true);
    expect(parts(0)).toBe(false);
    expect(parts(7)).toBe(false);
    expect(parts(1, "essay")).toBe(false);
  });

  test("a choice part takes 2 to 4 options, and no other part takes any", async () => {
    const part = { prompt: "Which?", kcId: "k1" };
    const choice = (options: string[] | null) =>
      accepts("ask", {
        prompt: "Case.",
        parts: [{ ...part, form: "choice", options }],
      });
    expect(choice(["A", "B"])).toBe(true);
    expect(choice(["A"])).toBe(false);
    expect(choice(["A", "B", "C", "D", "E"])).toBe(false);

    const run = (form: "short" | "choice", options: string[] | null) =>
      tutorTools({ ...noActions }).ask.execute!(
        { prompt: "Go.", parts: [{ ...part, form, options }] },
        { toolCallId: "1", messages: [] } as never,
      );
    await expect(run("choice", null)).rejects.toThrow("give options");
    await expect(run("short", ["A", "B"])).rejects.toThrow("give options");
    await expect(run("choice", ["A", "B"])).resolves.toEqual({
      questionId: "q-1",
    });
  });

  test("returns the Problem it poses", async () => {
    expect(await askWith(problem)).toEqual({ questionId: "q-2", problem });
    expect(await askWith(null)).toEqual({ questionId: "q-2" });
  });

  test("is refused while the newest Question is answered but ungraded", async () => {
    await expect(askWith(null, openQuestion)).rejects.toThrow("grade it first");
    // An unanswered one stays ungraded for good; a graded one is done.
    for (const newest of [
      { ...openQuestion, answered: false },
      { ...openQuestion, graded: true },
    ]) {
      await expect(askWith(null, newest)).resolves.toEqual({
        questionId: "q-2",
      });
    }
  });
});

describe("compute", () => {
  const call = (compute: TutorToolActions["compute"], program: string) =>
    tutorTools({ ...noActions, compute }).compute.execute!({ program }, {
      toolCallId: "1",
      messages: [],
    } as never);

  test("runs the program and returns its values", async () => {
    const programs: string[] = [];
    const value = { value: 14, unit: "kN", text: "14 kN" };
    const output = await call(async (program) => {
      programs.push(program);
      return { ok: true, values: { thrust: value }, answers: [] };
    }, "thrust = 14 kN");
    expect(output).toEqual({ values: { thrust: value } });
    expect(programs).toEqual(["thrust = 14 kN"]);
  });

  test("returns a failed run's error as data", async () => {
    const error = "These variable names are mathjs units: m.";
    await expect(
      call(async () => ({ ok: false, error }), "m = 2 kg"),
    ).resolves.toEqual({ error });
  });

  test("takes a program that is not empty", () => {
    expect(accepts("compute", { program: "" })).toBe(false);
    expect(accepts("compute", { program: "x = 1" })).toBe(true);
  });
});

test("remember takes one line of at most 300 characters", () => {
  const text = (value: string) => accepts("remember", { text: value });
  expect(text("x".repeat(300))).toBe(true);
  expect(text("")).toBe(false);
  expect(text("x".repeat(301))).toBe(false);
  expect(text("Likes proofs\nHates graphs")).toBe(false);
  expect(text("Likes proofs\r")).toBe(false);
});
