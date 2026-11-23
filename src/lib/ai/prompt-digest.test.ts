import { describe, expect, it } from "vitest";
import { z } from "zod";
import { promptDigest } from "@/lib/ai/prompt-digest";

describe("promptDigest", () => {
  const schema = z.object({ name: z.string().describe("Short.") });

  it("is the same for the same prompt and schema", () => {
    expect(promptDigest("List the KCs.", schema)).toBe(
      promptDigest(
        "List the KCs.",
        z.object({ name: z.string().describe("Short.") }),
      ),
    );
  });

  it("changes when the prompt or the schema changes", () => {
    const digest = promptDigest("List the KCs.", schema);
    expect(promptDigest("List the KCs!", schema)).not.toBe(digest);
    expect(
      promptDigest("List the KCs.", z.object({ name: z.string() })),
    ).not.toBe(digest);
  });
});
