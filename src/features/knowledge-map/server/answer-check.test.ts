// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { UnreadableAnswerError } from "@/features/knowledge-map/domain/answer-keys";

vi.mock("server-only", () => ({}));

const { checkAnswer, checkAnswers, checkEachAnswer } =
  await import("./answer-check");

const thrust = { label: "Thrust", value: "17.5 kN", anyOrder: false };
const count = { label: "Count", value: "5", anyOrder: false };

/** Short values whose evaluation runs for minutes or fills the memory. */
const RUNAWAY = [
  "combinations(1e15, 5e14)",
  "bellNumbers(20000)",
  "f(n) = n < 1 ? 1 : f(n-1) + f(n-1); f(40)",
  `setPowerset([${Array.from({ length: 28 }, (_, i) => i + 1).join(",")}])`,
];

describe("the answer check under its time limit", () => {
  test("checks a value as the domain check does", () => {
    expect(checkAnswer(thrust, "17500 N")).toBe("match");
    expect(checkAnswer(thrust, "12 kN")).toBe("mismatch");
    expect(() => checkAnswer(thrust, "17,5 kN ??")).toThrow(
      UnreadableAnswerError,
    );
  });

  test.each(RUNAWAY)("stops the check of %s", (value) => {
    const started = Date.now();

    expect(() => checkAnswer(count, value)).toThrow(UnreadableAnswerError);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  test("stops the check of a runaway key", () => {
    const key = { label: "Count", value: RUNAWAY[0]!, anyOrder: false };

    expect(() => checkAnswer(key, "5")).toThrow(UnreadableAnswerError);
  });

  test("checks the next value after a stopped one", () => {
    expect(() => checkAnswer(count, RUNAWAY[0]!)).toThrow();

    expect(checkAnswer(count, "5")).toBe("match");
  });

  test("checkAnswers names a runaway value as the one to fix", () => {
    const checked = checkAnswers([count], [{ value: RUNAWAY[0]! }]);

    expect(checked).toEqual({
      ok: false,
      error: expect.stringContaining("takes too long to check"),
    });
  });

  test("checkEachAnswer leaves a runaway value unchecked and checks the rest", () => {
    const checks = checkEachAnswer(
      [count, thrust],
      [
        { label: "Count", value: RUNAWAY[0]! },
        { label: "Thrust", value: "17500 N" },
      ],
    );

    expect(checks).toEqual(["unchecked", "match"]);
  });
});
