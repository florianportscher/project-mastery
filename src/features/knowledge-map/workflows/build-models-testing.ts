import { simulateReadableStream } from "ai";
import { MockEmbeddingModelV4, MockLanguageModelV4 } from "ai/test";
import { vi } from "vitest";
import { useMockModels } from "@/lib/ai/testing";

/**
 * The mock models of the build workflow tests (`build-testing.ts` holds the
 * fake database): `map` extraction, merge and check calls, `exercise` calls
 * and `embed` vectors, one call at a time, every structured call streamed.
 */

type Prompt = Array<{ role: string; content: unknown }>;

/** The JSON of a call's user message. */
function userJson(prompt: unknown): Record<string, unknown> {
  const user = (prompt as Prompt).find((message) => message.role === "user");
  const [part] = user!.content as Array<{ text: string }>;
  return JSON.parse(part!.text) as Record<string, unknown>;
}

/** A teaching unit as its extraction call sent it. */
export type SentUnit = {
  material: string;
  outline: string[];
  language: string;
  chunks: Array<{ id: string; markdown: string }>;
  knownKcs: Array<{
    id: string;
    chapter: string;
    name: string;
    description: string;
  }>;
};

/** The title of the unit's Chapter: its marked Outline line. */
export function unitTitle(unit: { outline: string[] }): string {
  const marked = unit.outline.find((line) => line.endsWith("<- this unit"));
  return marked!.replace("<- this unit", "").trim();
}

/** An exercise batch as its call sent it. */
export type SentExerciseUnit = {
  material: string;
  outline: string[];
  language: string;
  exercises: Array<{ id: string; statement: string; solution: string | null }>;
  kcs: Array<{ id: string; name: string }>;
};

/** A grouping call's input: exercise and solution chunks by short id. */
export type SentGrouping = {
  exercises: Array<{ id: string; text: string }>;
  solutions: Array<{ id: string; text: string }>;
};

/** An Exercise the grouping mock answers, by its chunks' texts. */
export type GroupAnswer = { question: string[]; solution?: string[] };

/** What the exercise mock answers for an Exercise: KCs by name. */
export type SubtaskAnswer = {
  kcs?: string[];
  newKcs?: string[];
  finalAnswers?: Array<{ label: string; value: string; anyOrder: boolean }>;
  notAnExercise?: boolean;
};

/** A streamed answer of `value` as JSON, or of nothing. */
const answer = (value: unknown) => ({
  stream: simulateReadableStream({
    chunks: [
      { type: "text-start" as const, id: "text-1" },
      {
        type: "text-delta" as const,
        id: "text-1",
        delta: value === undefined ? "" : JSON.stringify(value),
      },
      { type: "text-end" as const, id: "text-1" },
      {
        type: "finish" as const,
        finishReason: { unified: "stop" as const, raw: undefined },
        usage: {
          inputTokens: {
            total: 100,
            noCache: 100,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: { total: 10, text: 10, reasoning: undefined },
        },
      },
    ],
  }),
});

/** The Course as the tree call sent it. */
export type SentCourse = {
  language: string;
  materials: Array<{
    name: string;
    outline: Array<{
      id: string;
      title: string;
      depth: number;
      kcs?: string[];
    }>;
  }>;
  storedTopics: Array<{
    id: string;
    name: string;
    level: number;
    chapters: string[];
  }>;
};

/** A Topic of the tree call's answer. */
export type TreeTopicAnswer = {
  level: number;
  name: string;
  chapterIds: string[];
  centralQuestion: string;
  continues: string;
};

/**
 * The default tree answer: one top-level Topic per Chapter with KCs, named
 * by its title, continuing the stored Topic that held that Chapter.
 */
export function flatTree(course: SentCourse): TreeTopicAnswer[] {
  return course.materials.flatMap((material) =>
    material.outline.flatMap((chapter) =>
      chapter.kcs
        ? [
            {
              level: 1,
              name: chapter.title,
              chapterIds: [chapter.id],
              centralQuestion: `What is ${chapter.title}?`,
              continues:
                course.storedTopics.find((topic) =>
                  topic.chapters.includes(chapter.id),
                )?.id ?? "",
            },
          ]
        : [],
    ),
  );
}

/** The Prerequisite check's input, as it was sent. */
export type SentCheck = {
  names: Array<{
    id: string;
    name: string;
    description: string;
    usedBy: string;
  }>;
  kcs: Array<{ id: string; name: string }>;
};

/**
 * Routes the `map`, `exercise` and `embed` tasks to mocks, one call at a
 * time. The extraction gives each unit the KCs `kcsOf` names (by default
 * one named after the unit's Chapter), citing its first chunk (or the id
 * `chunkIdOf` gives), using the KCs `prerequisitesOf` names (a known KC's
 * or an earlier new KC's id by name, else the name itself as an id) and
 * using from outside the names `assumesOf` says (by default nothing), each
 * described "About <name>." as a KC of that name is; it names under
 * repeats the known KCs `repeatsOf` names, citing the unit's first chunk.
 * The calls `rateLimitedCalls` count meet the rate limit, its first
 * `timeoutCalls` other calls time out, and the next `blankCalls` answer
 * nothing. The Prerequisite check picks the KC named `meaningOf` the name
 * (by default the name itself). Every KC text gets a one-hot vector of its
 * own, so equal texts are alike and others are not. `afterCall` runs after
 * each extraction call. The `exercise` task answers each Exercise with what
 * `subtaskOf` says (by default nothing), naming offered KCs by name. The
 * `ingest` task's grouping call answers the Exercises `groupsOf` names by
 * their chunks' texts (by default none, so each exercise chunk is one), its
 * first `groupingFails` calls with nothing valid.
 */
export function useBuildModels({
  kcsOf = (unit) => [unitTitle(unit)],
  assumesOf = () => [],
  prerequisitesOf = () => [],
  repeatsOf = () => [],
  chunkIdOf = (_kc, unit) => unit.chunks[0]!.id,
  meaningOf = (name) => name.name,
  subtaskOf = () => ({}),
  groupsOf = () => [],
  groupingFails = 0,
  blankCalls = 0,
  timeoutCalls = 0,
  rateLimitedCalls = [],
  afterCall,
  treeOf = flatTree,
}: {
  /** The tree call's Topics; undefined for no valid answer. */
  treeOf?: (course: SentCourse) => TreeTopicAnswer[] | undefined;
  kcsOf?: (unit: SentUnit) => string[];
  assumesOf?: (kc: string) => string[];
  prerequisitesOf?: (kc: string) => string[];
  repeatsOf?: (unit: SentUnit) => string[];
  chunkIdOf?: (kc: string, unit: SentUnit) => string;
  meaningOf?: (name: SentCheck["names"][number]) => string | null;
  subtaskOf?: (
    exercise: SentExerciseUnit["exercises"][number],
  ) => SubtaskAnswer;
  groupsOf?: (sent: SentGrouping) => GroupAnswer[];
  groupingFails?: number;
  blankCalls?: number;
  /** Extraction calls that run into their time limit first. */
  timeoutCalls?: number;
  /** The extraction calls, counted from 1, the Gateway's rate limit turns away. */
  rateLimitedCalls?: number[];
  afterCall?: (count: number) => void;
} = {}) {
  const timeouts = Array.from({ length: timeoutCalls }, () => true);
  const extractions: SentUnit[] = [];
  const checks: SentCheck[] = [];
  const embedded: string[] = [];
  /** Each `map` call's reasoning setting. */
  const reasoning: unknown[] = [];
  const blanks = Array.from({ length: blankCalls }, () => true);
  /** Every extraction call, answered or not. */
  const extractCalls: unknown[] = [];
  const map = new MockLanguageModelV4({
    doStream: async (options) => {
      reasoning.push(options.reasoning);
      const sent = userJson(options.prompt);
      if ("names" in sent) {
        const check = sent as SentCheck;
        checks.push(check);
        return answer({
          meanings: Object.fromEntries(
            check.names.map((name) => [
              name.id,
              check.kcs.find((kc) => kc.name === meaningOf(name))?.id ?? null,
            ]),
          ),
        });
      }
      extractCalls.push(sent);
      if (rateLimitedCalls.includes(extractCalls.length)) {
        throw Object.assign(
          new Error("Rate limit exceeded. Retry after 20s."),
          { name: "GatewayRateLimitError" },
        );
      }
      if (timeouts.pop()) {
        // What the AI SDK's `timeout` aborts the call with.
        throw new DOMException("Total timeout exceeded", "TimeoutError");
      }
      if (blanks.pop()) return answer(undefined);
      const unit = sent as SentUnit;
      extractions.push(unit);
      const names = kcsOf(unit);
      const idOf = (name: string, before: number) =>
        unit.knownKcs.find((kc) => kc.name === name)?.id ??
        (names.slice(0, before).includes(name)
          ? `n${names.indexOf(name) + 1}`
          : name);
      const result = answer({
        repeats: repeatsOf(unit).map((name) => ({
          kcId: idOf(name, 0),
          chunkIds: [unit.chunks[0]!.id],
        })),
        kcs: names.map((name, index) => ({
          id: `n${index + 1}`,
          name,
          description: `About ${name}.`,
          chunkIds: [chunkIdOf(name, unit)],
          prerequisites: prerequisitesOf(name).map((p) => idOf(p, index)),
          outside: assumesOf(name).map((assumed) => ({
            name: assumed,
            description: `About ${assumed}.`,
          })),
        })),
      });
      afterCall?.(extractions.length);
      return result;
    },
  });
  const dimensions = 64;
  const texts: string[] = [];
  const embed = new MockEmbeddingModelV4({
    doEmbed: async ({ values }) => {
      embedded.push(...values);
      return {
        embeddings: values.map((text) => {
          if (!texts.includes(text)) texts.push(text);
          return Array.from({ length: dimensions }, (_, index) =>
            index === texts.indexOf(text) % dimensions ? 1 : 0,
          );
        }),
        usage: undefined,
        warnings: [],
      };
    },
  });
  const trees: SentCourse[] = [];
  const topic = new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const course = userJson(prompt) as SentCourse;
      trees.push(course);
      const topics = treeOf(course);
      return answer(topics && { topics });
    },
  });
  const exercises: SentExerciseUnit[] = [];
  const exercise = new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const unit = userJson(prompt) as SentExerciseUnit;
      exercises.push(unit);
      return answer({
        exercises: unit.exercises.map((exercise) => {
          const said = subtaskOf(exercise);
          return {
            id: exercise.id,
            notAnExercise: said.notAnExercise ?? false,
            kcIds: (said.kcs ?? []).flatMap(
              (name) => unit.kcs.find((kc) => kc.name === name)?.id ?? [],
            ),
            newKcs: (said.newKcs ?? []).map((name) => ({
              name,
              description: `About ${name}.`,
            })),
            finalAnswers: said.finalAnswers ?? [],
          };
        }),
      });
    },
  });
  const groupings: SentGrouping[] = [];
  const ingest = new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const sent = userJson(prompt) as SentGrouping;
      groupings.push(sent);
      if (groupings.length <= groupingFails) return answer(undefined);
      const idOf = (items: SentGrouping["exercises"], text: string) =>
        items.find((item) => item.text === text)?.id ?? text;
      return answer({
        exercises: groupsOf(sent).map((group) => ({
          questionIds: group.question.map((t) => idOf(sent.exercises, t)),
          solutionIds: (group.solution ?? []).map((t) =>
            idOf(sent.solutions, t),
          ),
        })),
      });
    },
  });
  useMockModels({ map, embed, exercise, topic, ingest });
  vi.stubEnv("AI_CONCURRENCY", "1");
  return {
    extractions,
    checks,
    embedded,
    exercises,
    groupings,
    reasoning,
    trees,
  };
}
