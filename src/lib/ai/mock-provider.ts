import "server-only";
import { simulateReadableStream, type JSONSchema7 } from "ai";
import { getAiEnv } from "./env";
import { assertStrictOutputSchema } from "./strict-schema";

/**
 * Deterministic models for AI_PROVIDER=mock, so end-to-end tests run the real
 * app without model calls (ADR 0006). Every model id answers, whatever the
 * task: a language model replies to the last user message, streamed word by
 * word slowly enough that a test can stop it mid-reply. Unlike the helpers in
 * `testing.ts`, this runs in the production build and does not use Vitest.
 */

/** Delay between streamed words, a reply takes a few seconds in total. */
const WORD_DELAY_MS = 75;

// The size of chunks.embedding, so the mock's vectors fit the column.
const EMBEDDING_DIMENSIONS = 2048;

/** Usage the mock reports, so cost recording sees real numbers. */
const usage = {
  inputTokens: {
    total: 10,
    noCache: 10,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

const finishReason = { unified: "stop" as const, raw: undefined };

type Prompt = ReadonlyArray<{ role: string; content: unknown }>;

type Part = {
  type: string;
  text?: string;
  filename?: string;
  mediaType?: string;
};

/**
 * The block a Chat's handler puts in front of the newest Student message:
 * the tutor context, which the mock reads ids from but never echoes.
 */
const CONTEXT_START = "<tutor-context>";

const isContext = (part: Part) =>
  part.type === "text" && (part.text ?? "").startsWith(CONTEXT_START);

function lastUserContent(prompt: Prompt): Part[] {
  const message = prompt.findLast((m) => m.role === "user");
  if (!message) return [];
  if (typeof message.content === "string") {
    return [{ type: "text", text: message.content }];
  }
  return Array.isArray(message.content) ? (message.content as Part[]) : [];
}

/** The newest Student message's parts, without the tutor context. */
function lastUserParts(prompt: Prompt): Part[] {
  return lastUserContent(prompt).filter((part) => !isContext(part));
}

/** The tutor context in front of the newest Student message, or "". */
function tutorContextText(prompt: Prompt): string {
  return lastUserContent(prompt).find(isContext)?.text ?? "";
}

const MOCK_REPLY_START = 'Mock reply to "';

/** Whether a stored reply's text came from the mock models. */
export function isMockReply(text: string): boolean {
  return text.startsWith(MOCK_REPLY_START);
}

/**
 * The reply to a prompt: names the question and the files sent with it, so
 * tests can tell replies apart and see what reached the AI.
 */
export function mockReply(prompt: Prompt): string {
  const parts = lastUserParts(prompt);
  const text = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join(" ");
  const files = parts
    .filter((part) => part.type === "file")
    .map((part) => `${part.filename ?? "file"} (${part.mediaType})`);
  const attached = files.length > 0 ? ` Attached: ${files.join(", ")}.` : "";
  return `${MOCK_REPLY_START}${text}".${attached} This is a deterministic answer from the mock AI. It streams word by word, slowly enough for an end-to-end test to stop it before it ends, and it never calls a real model.`;
}

/** The text of every string in a mock object: inline math, so it renders. */
const MOCK_OBJECT_TEXT =
  "Mock text from the mock AI, with a formula: $a^2 + b^2 = c^2$.";

type SchemaDefinition = JSONSchema7 | boolean;

/**
 * A deterministic value that fits a JSON schema, for structured output
 * (`Output.object`): required properties only, one item per array (every
 * value for an array of enum values), the first enum value, null where null
 * is allowed, and strings with a formula.
 */
function mockObject(definition: SchemaDefinition | undefined): unknown {
  const schema = typeof definition === "object" ? definition : {};
  const options = schema.anyOf ?? schema.oneOf;
  if (options) {
    const isNull = (option: SchemaDefinition) =>
      typeof option === "object" && option.type === "null";
    return options.some(isNull) ? null : mockObject(options[0]);
  }
  if (schema.enum) return schema.enum[0];
  const types = [schema.type ?? "object"].flat();
  if (types.includes("null")) return null;
  switch (types[0]) {
    case "object":
      return Object.fromEntries(
        (schema.required ?? []).map((key) => [
          key,
          mockObject(schema.properties?.[key]),
        ]),
      );
    case "array": {
      const items = [schema.items].flat()[0];
      // Every value of an enum, such as ids a prompt offers, so a caller that
      // must see each id once gets a valid answer.
      if (typeof items === "object" && items.enum) return [...items.enum];
      return [mockObject(items)];
    }
    case "string":
      return MOCK_OBJECT_TEXT;
    case "number":
    case "integer":
      return 1;
    case "boolean":
      return false;
    default:
      return null;
  }
}

type ResponseFormat =
  { type: "text" } | { type: "json"; schema?: JSONSchema7 } | undefined;

/** How long a `timeout` fault holds a call before it fails. */
const TIMEOUT_MS = 30_000;

/**
 * The failure every mock call shows while MOCK_AI_FAULT names one (set by
 * `agent up --mock-fault`; never in tests or e2e), so a developer can see
 * the app's error states.
 */
function mockFault() {
  return getAiEnv().MOCK_AI_FAULT;
}

/** Applies `error` and `timeout`: throws, the latter after a wait. */
async function failCall(signal?: AbortSignal) {
  const fault = mockFault();
  if (fault === "timeout") {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, TIMEOUT_MS);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        resolve();
      });
    });
    throw new Error("Mock AI fault: the call timed out.");
  }
  if (fault === "error") throw new Error("Mock AI fault: the call failed.");
}

/** The text a mock call answers: JSON for structured output, else a reply. */
function mockText(prompt: Prompt, responseFormat: ResponseFormat): string {
  const fault = mockFault();
  if (fault === "empty") return "";
  if (fault === "malformed") {
    // Half a JSON string is no reply: a text call fails like `error`.
    if (responseFormat?.type !== "json")
      throw new Error("Mock AI fault: the call failed.");
    return '{"mock": [';
  }
  if (responseFormat?.type === "json") {
    assertStrictOutputSchema(responseFormat);
    return JSON.stringify(mockObject(responseFormat.schema));
  }
  return mockReply(prompt);
}

/** A Student's message that starts with this makes the tutor mock ask. */
const MOCK_QUIZ_REQUEST = "Quiz me";

/**
 * A Student's message that starts with this makes the tutor mock open the
 * first Reading section the instructions list.
 */
const MOCK_READING_REQUEST = "Read with me";

const MOCK_READING_PURPOSE = "Mock purpose: what makes thrust?";

const MOCK_QUESTION = "Mock question: what is $2 + 2$?";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

type MockTool = { name: string; inputSchema?: JSONSchema7 };

/**
 * `value` without the properties its schema leaves optional, at every depth.
 * A real model leaves optional fields out: MiMo sent `grade` without its
 * then-optional `results` (2026-11-09). So code that needs a field fails on
 * the mock too, unless the field is required.
 */
function requiredOnly(value: unknown, definition?: SchemaDefinition): unknown {
  if (typeof definition !== "object") return value;
  const options = definition.anyOf ?? definition.oneOf;
  if (options && value !== null) {
    const fit = options.find(
      (option) => typeof option === "object" && option.type !== "null",
    );
    return requiredOnly(value, fit);
  }
  if (Array.isArray(value)) {
    const items = [definition.items].flat()[0];
    return value.map((item) => requiredOnly(item, items));
  }
  if (value === null || typeof value !== "object" || !definition.properties) {
    return value;
  }
  const required = new Set(definition.required ?? []);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => required.has(key))
      .map(([key, field]) => [
        key,
        requiredOnly(field, definition.properties?.[key]),
      ]),
  );
}

/**
 * One tool call as a whole streamed step, with only the input fields the
 * tool requires.
 */
function toolCallStream(
  id: string,
  tool: MockTool | undefined,
  toolName: string,
  input: unknown,
) {
  return simulateReadableStream({
    initialDelayInMs: null,
    chunkDelayInMs: null,
    chunks: [
      { type: "stream-start" as const, warnings: [] },
      {
        type: "tool-call" as const,
        toolCallId: id,
        toolName,
        input: JSON.stringify(requiredOnly(input, tool?.inputSchema)),
      },
      {
        type: "finish" as const,
        finishReason: { unified: "tool-calls" as const, raw: undefined },
        usage,
      },
    ],
  });
}

type ToolPart = {
  type: string;
  toolName?: string;
  input?: unknown;
  output?: { type?: string };
};

/**
 * The KCs of the question the reply before the Student's last message
 * asked, when the ask succeeded and no grade followed: the one that message
 * answers.
 */
function openQuestion(prompt: Prompt): { kcIds: string[] } | undefined {
  let asked = false;
  for (const message of prompt.toReversed().slice(1)) {
    if (message.role === "user") return undefined;
    if (!Array.isArray(message.content)) continue;
    for (const part of (message.content as ToolPart[]).toReversed()) {
      if (part.type === "tool-result" && part.toolName === "grade") {
        return undefined;
      }
      if (part.type === "tool-result" && part.toolName === "ask") {
        asked = part.output?.type !== "error-text";
      }
      if (part.type === "tool-call" && part.toolName === "ask") {
        const input = (
          typeof part.input === "string" ? JSON.parse(part.input) : part.input
        ) as { kcIds?: string[] };
        return asked ? { kcIds: input.kcIds ?? [] } : undefined;
      }
    }
  }
  return undefined;
}

/**
 * In a Chat, the tutor's questions and readings: a Student message starting
 * with "Quiz me" gets an `ask` call on the first KC id the tutor context
 * names, one starting with "Read with me" a `showReading` call on the first
 * Reading section it names, and any other message right after an `ask` a
 * `grade` call with every KC of the asked question full. Each then ends its
 * step.
 */
function mockTutorQuestions(
  prompt: Prompt,
  tools: ReadonlyArray<MockTool> | undefined,
) {
  if (!tools?.some(({ name }) => name === "ask")) return null;
  const call = (id: string, toolName: string, input: unknown) =>
    toolCallStream(
      id,
      tools.find(({ name }) => name === toolName),
      toolName,
      input,
    );
  if (prompt.at(-1)?.role !== "user") return null;
  const text = lastUserParts(prompt)
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join(" ");
  const answered =
    !text.startsWith(MOCK_QUIZ_REQUEST) &&
    !text.startsWith(MOCK_READING_REQUEST) &&
    openQuestion(prompt);
  if (answered) {
    return call("mock-grade", "grade", {
      results: answered.kcIds.map((kcId) => ({ kcId, result: "full" })),
      help: "none",
    });
  }
  const context = tutorContextText(prompt);
  if (text.startsWith(MOCK_READING_REQUEST)) {
    const sectionId = new RegExp(`section id (${UUID})`).exec(context)?.[1];
    if (!sectionId) return null;
    return call("mock-show-reading", "showReading", {
      sectionId,
      purpose: MOCK_READING_PURPOSE,
    });
  }
  if (!text.startsWith(MOCK_QUIZ_REQUEST)) return null;
  const kcId = new RegExp(`KC id (${UUID})`).exec(context)?.[1];
  if (!kcId) return null;
  return call("mock-ask", "ask", {
    prompt: MOCK_QUESTION,
    kcIds: [kcId],
  });
}

function languageModel(modelId: string) {
  return {
    specificationVersion: "v4" as const,
    provider: "mock",
    modelId,
    supportedUrls: {},
    doGenerate: async ({
      prompt,
      responseFormat,
      abortSignal,
    }: {
      prompt: Prompt;
      responseFormat?: ResponseFormat;
      abortSignal?: AbortSignal;
    }) => {
      await failCall(abortSignal);
      return {
        content: [
          { type: "text" as const, text: mockText(prompt, responseFormat) },
        ],
        finishReason,
        usage,
        warnings: [],
      };
    },
    doStream: async ({
      prompt,
      tools,
      responseFormat,
      abortSignal,
    }: {
      prompt: Prompt;
      tools?: ReadonlyArray<MockTool>;
      responseFormat?: ResponseFormat;
      abortSignal?: AbortSignal;
    }) => {
      await failCall(abortSignal);
      return {
        stream:
          (mockFault() ? null : mockTutorQuestions(prompt, tools)) ??
          simulateReadableStream({
            initialDelayInMs: null,
            // Structured output streams at once: no Student watches it.
            chunkDelayInMs:
              responseFormat?.type === "json" ? null : WORD_DELAY_MS,
            chunks: [
              { type: "stream-start" as const, warnings: [] },
              { type: "text-start" as const, id: "text-1" },
              ...mockText(prompt, responseFormat)
                .split(/(?<= )/)
                .map((delta) => ({
                  type: "text-delta" as const,
                  id: "text-1",
                  delta,
                })),
              { type: "text-end" as const, id: "text-1" },
              { type: "finish" as const, finishReason, usage },
            ],
          }),
      };
    },
  };
}

function embeddingModel(modelId: string) {
  return {
    specificationVersion: "v4" as const,
    provider: "mock",
    modelId,
    maxEmbeddingsPerCall: undefined,
    supportsParallelCalls: true,
    doEmbed: async ({
      values,
      abortSignal,
    }: {
      values: string[];
      abortSignal?: AbortSignal;
    }) => {
      await failCall(abortSignal);
      return {
        embeddings: values.map(() =>
          Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0.5),
        ),
        // Like some providers, which report no usage for embeddings.
        usage: undefined,
        warnings: [],
      };
    },
  };
}

/** What the mock transcription model hears in any recording. */
const MOCK_DICTATION = "The determinant of A is zero, so A is not invertible.";

/**
 * Answers any audio with `MOCK_DICTATION`, 5 seconds long, with no token
 * usage, like `openai/gpt-transcribe` (docs/agents/notes/gpt-transcribe.md).
 */
function transcriptionModel(modelId: string) {
  return {
    specificationVersion: "v4" as const,
    provider: "mock",
    modelId,
    doGenerate: async () => ({
      text: MOCK_DICTATION,
      segments: [],
      language: "en",
      durationInSeconds: 5,
      warnings: [],
      response: { timestamp: new Date(), modelId, headers: undefined },
    }),
  };
}

function unsupported(kind: string) {
  return (modelId: string): never => {
    throw new Error(`AI_PROVIDER=mock has no ${kind} model ("${modelId}").`);
  };
}

export function routeToMockModels() {
  globalThis.AI_SDK_DEFAULT_PROVIDER ??= {
    specificationVersion: "v4",
    languageModel,
    embeddingModel,
    imageModel: unsupported("image"),
    transcriptionModel,
  };
}
