import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { gateway } from "ai";
import { getAiEnv, type AiEnv } from "./env";
import { routeToMockModels } from "./mock-provider";
import { AUDIO_PRICES, MODEL_PRICES } from "./prices";

export type TaskConfig = {
  /** Gateway model id (`provider/model`), resolved through AI Gateway. */
  model: string;
  /** Environment variable that overrides `model` without a code change. */
  override: Extract<keyof AiEnv, `AI_MODEL_${string}`>;
};

/**
 * The single per-task model configuration (ADR 0005). Feature
 * code asks for a task through `aiTask`, never for a model id.
 *
 * Every text task runs Muse Ember (ADR 0006), which the Gateway's free
 * credit serves (docs/agents/notes/muse-ember.md). The real model per task is
 * chosen by testing on real course materials (open question in
 * docs/ARCHITECTURE.md). Local development can point a text task
 * at `google/gemini-3.5-flash-lite` through its override (ADR 0016).
 */
export const AI_TASKS = {
  /** The AI's replies in a Chat. */
  chat: {
    model: "meta/muse-ember",
    override: "AI_MODEL_CHAT",
  },
  /** The AI's replies in a Course's Brief, where it asks about the exam. */
  brief: {
    model: "meta/muse-ember",
    override: "AI_MODEL_BRIEF",
  },
  /** A short title for a Chat. */
  title: {
    model: "meta/muse-ember",
    override: "AI_MODEL_TITLE",
  },
  /** Vision: a rendered page image to markdown with LaTeX (ADR 0007). */
  ingest: {
    model: "meta/muse-ember",
    override: "AI_MODEL_INGEST",
  },
  /** Builds a Course's Knowledge map from its chunks. */
  map: {
    model: "meta/muse-ember",
    override: "AI_MODEL_MAP",
  },
  /** The Exercises of a Knowledge map build and the KCs they test. */
  exercise: {
    model: "meta/muse-ember",
    override: "AI_MODEL_EXERCISE",
  },
  /** Proposes a Knowledge map build's Topic tree, with structured output. */
  topic: {
    model: "meta/muse-ember",
    override: "AI_MODEL_TOPIC",
  },
  /**
   * One call per generated Problem, a variant of an Exercise or a new
   * Problem, with structured output and medium thinking; a draft whose
   * program fails goes back once.
   */
  generate: {
    model: "meta/muse-ember",
    override: "AI_MODEL_GENERATE",
  },
  /**
   * One call per answered item of a submitted Mock exam: points per step
   * with reasons, a result per KC and the final value, with structured
   * output. Metered, but not refused at the Daily limit.
   */
  grade_exam: {
    model: "meta/muse-ember",
    override: "AI_MODEL_GRADE_EXAM",
  },
  /**
   * One call per ended Study session that writes its Session note, its
   * Topic's Topic note and Memory lines, and condenses a long Memory, with
   * structured output. Metered, but not refused at the Daily limit.
   */
  close: {
    model: "meta/muse-ember",
    override: "AI_MODEL_CLOSE",
  },
  /**
   * Chunk embeddings for pgvector. Changing the model or its dimensions means
   * re-embedding and a new `chunks.embedding` column size.
   */
  embed: {
    model: "cohere/embed-v5.0-fast",
    override: "AI_MODEL_EMBED",
  },
  /**
   * A Student's Dictation to text, billed per audio hour (AUDIO_PRICES).
   * Through AI Gateway in local development too
   * (docs/agents/notes/gpt-transcribe.md).
   */
  transcribe: {
    model: "openai/gpt-transcribe",
    override: "AI_MODEL_TRANSCRIBE",
  },
} as const satisfies Record<string, TaskConfig>;

export type AiTask = keyof typeof AI_TASKS;

/**
 * Provider options of an `embed` call whose values are documents to be
 * searched, such as chunks: Cohere's input type, which the Gateway takes
 * (docs/agents/notes/cohere-embeddings.md).
 */
export const EMBED_AS_DOCUMENTS = {
  cohere: { inputType: "search_document" },
} as const;

/**
 * Retries per call for retryable errors such as `429` from rate limits. The
 * AI SDK backs off exponentially and honors `retry-after`.
 */
const AI_MAX_RETRIES = 3;

const taskConfig = (task: AiTask): TaskConfig => AI_TASKS[task];

/**
 * Models that take only `toolChoice: "auto"`. Verified live on 2026-11-12:
 * `meta/muse-ember` answers `"none"` with a 400, and with no tools offered
 * (`activeTools: []`) it still calls one, so a step can't be made text-only.
 */
const AUTO_TOOL_CHOICE_ONLY: ReadonlySet<string> = new Set(["meta/muse-ember"]);

/**
 * The settings of a step that should write text rather than call tools:
 * `toolChoice: "none"`, or nothing for a model that refuses it.
 */
export function textOnlyStep(model: string) {
  return AUTO_TOOL_CHOICE_ONLY.has(model)
    ? undefined
    : { toolChoice: "none" as const };
}

/**
 * The env override of a task's default model. Configured models are checked
 * for prices by a unit test, overrides here, since every call is priced.
 */
function overrideFor(task: AiTask): string | undefined {
  const config = taskConfig(task);
  const override = getAiEnv()[config.override];
  const [prices, table] =
    task === "transcribe"
      ? [AUDIO_PRICES, "AUDIO_PRICES"]
      : [MODEL_PRICES, "MODEL_PRICES"];
  if (override !== undefined && !(override in prices)) {
    throw new Error(
      `${config.override}="${override}" has no price. Add it to ${table} in src/lib/ai/prices.ts.`,
    );
  }
  return override;
}

export function modelIdFor(task: AiTask): string {
  return overrideFor(task) ?? taskConfig(task).model;
}

/** Model ids the Gemini API serves directly, when a Google key is set. */
const GOOGLE_PREFIX = "google/";

/**
 * Local development (ADR 0016): sends `google/` model ids straight to the
 * Gemini API with the Google key, and every other id through AI Gateway,
 * which serves no Google model on its free credit. Muse and the embeddings
 * stay on the gateway.
 */
function routeToGeminiApi(apiKey: string) {
  globalThis.AI_SDK_DEFAULT_PROVIDER ??= geminiRouter(apiKey);
}

function geminiRouter(apiKey: string) {
  const google = createGoogleGenerativeAI({ apiKey });
  const geminiId = (id: string) => id.slice(GOOGLE_PREFIX.length);
  return {
    specificationVersion: "v4" as const,
    languageModel: (id: string) =>
      id.startsWith(GOOGLE_PREFIX)
        ? google.languageModel(geminiId(id))
        : gateway.languageModel(id),
    embeddingModel: (id: string) =>
      id.startsWith(GOOGLE_PREFIX)
        ? google.embeddingModel(geminiId(id))
        : gateway.embeddingModel(id),
    imageModel: (id: string) => gateway.imageModel(id),
    transcriptionModel: (id: string) => gateway.transcriptionModel(id),
  };
}

/** Routes model ids for this environment. Mock mode answers every id. */
function routeModels(env: AiEnv) {
  if (env.AI_PROVIDER === "mock") routeToMockModels();
  else if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
    routeToGeminiApi(env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
}

/**
 * Call settings for one AI task: model, retries, Gateway tags and
 * telemetry. Spread it into every AI SDK call so each call is configured and
 * traced the same way:
 *
 *   streamText({ ...aiTask("chat"), instructions, messages })
 *   embed({ ...aiTask("embed"), value })
 */
export function aiTask(task: AiTask) {
  const model = modelIdFor(task);
  const env = getAiEnv();
  if (
    env.AI_PROVIDER !== "mock" &&
    model.startsWith(GOOGLE_PREFIX) &&
    !env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    throw new Error(
      `"${model}" needs GOOGLE_GENERATIVE_AI_API_KEY (local development, ADR 0016)`,
    );
  }
  routeModels(env);
  return {
    model,
    maxRetries: AI_MAX_RETRIES,
    providerOptions: {
      gateway: {
        // Groups the Gateway's spend reports by task.
        tags: [`task:${task}`],
      },
    },
    // Spans are emitted only when tracing is registered (src/instrumentation.ts).
    telemetry: { functionId: task },
  };
}
