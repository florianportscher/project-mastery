import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * The digest of a call's instructions: its system prompt and its output
 * schema, without any per-call input. A stored answer is reused only under
 * the digest it was answered with, so a prompt edit makes the next build
 * call again.
 */
export function promptDigest(instructions: string, schema: z.ZodType): string {
  return createHash("sha256")
    .update(instructions)
    .update("\u0000")
    .update(JSON.stringify(z.toJSONSchema(schema)))
    .digest("hex");
}
