import type { JSONSchema7 } from "ai";

type JSONSchema7Definition = JSONSchema7 | boolean;

/**
 * Structured output on a strict provider takes only JSON schemas whose
 * objects list every property in `required`. Muse Ember on AI Gateway rejects
 * any other schema before the model runs ("'required' is required to be
 * supplied and to be an array including every key in properties"), so a Zod
 * field with `.optional()` or `.default()` fails every call. The mock models
 * run this check on every structured call, so tests and mock runs fail the
 * same way. A field that may be absent is `.nullable()` instead.
 */
export function assertStrictOutputSchema(
  responseFormat: { type: string; schema?: JSONSchema7 } | undefined,
): void {
  if (responseFormat?.type !== "json" || !responseFormat.schema) return;
  const problem = firstNonStrictObject(responseFormat.schema, "$");
  if (problem) {
    throw new Error(
      `Structured output schema not accepted by strict providers: the object at ${problem.path} leaves ${problem.missing.map((key) => `'${key}'`).join(", ")} out of 'required'. Every key in 'properties' must be required; make a field that may be absent .nullable() instead of .optional() or .default().`,
    );
  }
}

type Problem = { path: string; missing: string[] };

function firstNonStrictObject(
  definition: JSONSchema7Definition | undefined,
  path: string,
): Problem | undefined {
  if (typeof definition !== "object") return undefined;
  const schema = definition;
  if (schema.properties) {
    const required = new Set(schema.required ?? []);
    const missing = Object.keys(schema.properties).filter(
      (key) => !required.has(key),
    );
    if (missing.length > 0) return { path, missing };
  }
  const children: [JSONSchema7Definition | undefined, string][] = [
    ...Object.entries(schema.properties ?? {}).map(
      ([key, child]): [JSONSchema7Definition, string] => [
        child,
        `${path}.${key}`,
      ],
    ),
    ...[schema.items]
      .flat()
      .map((child, index): [JSONSchema7Definition | undefined, string] => [
        child,
        Array.isArray(schema.items) ? `${path}[${index}]` : `${path}[]`,
      ]),
    ...[schema.anyOf, schema.oneOf, schema.allOf]
      .flatMap((options) => options ?? [])
      .map((child): [JSONSchema7Definition, string] => [child, path]),
    ...Object.entries({ ...schema.definitions, ...schema.$defs }).map(
      ([key, child]): [JSONSchema7Definition, string] => [
        child,
        `${path}.$defs.${key}`,
      ],
    ),
    [
      typeof schema.additionalProperties === "object"
        ? schema.additionalProperties
        : undefined,
      `${path}.*`,
    ],
  ];
  for (const [child, childPath] of children) {
    const problem = firstNonStrictObject(child, childPath);
    if (problem) return problem;
  }
  return undefined;
}
