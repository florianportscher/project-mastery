// @vitest-environment node
import path from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, test } from "vitest";

const eslint = new ESLint({
  cwd: path.resolve(import.meta.dirname, ".."),
  overrideConfig: {
    languageOptions: { parserOptions: { projectService: false } },
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/await-thenable": "off",
    },
  },
});

beforeAll(async () => {
  await eslint.lintText("export {};", { filePath: "src/lib/warm-up.ts" });
}, 60_000);

async function flagged(code, filePath = "src/lib/example.ts") {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages
    .filter((m) => m.ruleId === "project/no-dead-comments")
    .map((m) => m.messageId);
}

describe("project/no-dead-comments", () => {
  test.each([
    ["a divider line", "// ------------\nexport const a = 1;", "divider"],
    ["a block divider", "/* ==== */\nexport const a = 1;", "divider"],
    [
      "commented-out code",
      "// const old = compute(1);\nexport const a = 1;",
      "code",
    ],
    [
      "commented-out code over several lines",
      "// if (x) {\n//   run();\n// }\nexport const a = 1;",
      "code",
    ],
  ])("flags %s", async (_name, code, messageId) => {
    expect(await flagged(code)).toEqual([messageId]);
  });

  test.each([
    [
      "a why-comment",
      "// Stripe retries for 3 days, so keep the key.\nexport const a = 1;",
    ],
    [
      "a JSDoc block",
      "/**\n * Returns the total; zero when empty.\n */\nexport const a = 1;",
    ],
    [
      "a tool directive",
      "// @ts-expect-error vendor types\nexport const a = 1;",
    ],
  ])("allows %s", async (_name, code) => {
    expect(await flagged(code)).toEqual([]);
  });

  test("ignores the vendored folders", async () => {
    expect(
      await flagged("// -----\nexport const a = 1;", "src/components/ui/x.tsx"),
    ).toEqual([]);
  });
});
