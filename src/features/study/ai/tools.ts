import { hasToolCall, tool } from "ai";
import { z } from "zod";
import {
  checkAnswers,
  MAX_ANSWER_LENGTH,
  worstCheck,
  type AnswerCheck,
  type AnswerKey,
} from "@/features/knowledge-map/server";
import { computeTool } from "@/features/study/ai/compute-tool";
import type { ProgramRun } from "@/features/study/server/math-runner";
import type {
  AskedProblem,
  AttemptHelp,
  AttemptResult,
  ProblemView,
  GradedKc,
  GradedPart,
  PartForm,
  ReadingView,
  SourceChunkView,
  TopicView,
} from "@/features/study/types";

const kcIdsInputSchema = z.object({
  kcIds: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe("The ids of 1 to 8 KCs of this Course."),
});

/** The most KCs one question tests, as many as a Topic has at most. */
const MAX_QUESTION_KCS = 12;

/**
 * What `getTopic` takes: a Topic and, for source chunks, some of its KCs; or,
 * without a Topic, KCs of the Course alone.
 */
const getTopicInputSchema = z.object({
  topicId: z
    .string()
    .nullish()
    .describe(
      "The id of a Topic of this Course; omit it to read KCs that have no Topic id, by kcIds alone.",
    ),
  kcIds: z
    .array(z.string())
    .min(1)
    .max(MAX_QUESTION_KCS)
    .nullish()
    .describe(
      "The ids of KCs to read the source chunks of: of the Topic, or every KC of it when omitted; without a Topic, of the Course, and then required.",
    ),
});

/** The most parts one Question has. */
const MAX_PARTS = 6;

const askInputSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(20_000)
    .describe(
      "The case all parts work on, as the Student reads it above the parts, in Markdown with LaTeX. Complete on its own: give all data the Student needs.",
    ),
  parts: z
    .array(
      z.object({
        prompt: z
          .string()
          .min(1)
          .max(2000)
          .describe(
            "What this part asks, as the Student reads it above its field, in Markdown with LaTeX.",
          ),
        kcId: z.string().describe("The id of the KC of this Course it tests."),
        form: z
          .enum(["short", "long", "choice"])
          .describe(
            "The field it is answered in: short for a term, a number or a formula; long for a few sentences; choice for a pick among easily confused cases, with a Why? field beside the options.",
          ),
        options: z
          .array(z.string().min(1).max(300))
          .min(2)
          .max(4)
          .nullable()
          .describe(
            "For form choice only: the 2 to 4 options, the confusable cases, each a short statement; null for any other form. The Student picks one and says why.",
          ),
      }),
    )
    .min(1)
    .max(MAX_PARTS)
    .describe(
      "The 1 to 6 parts the Student answers, each in its own field, in order: position 1 is the first.",
    ),
  problemId: z
    .string()
    .nullish()
    .describe(
      "The id of the Problem from findProblems when the question poses the whole of it, since grading then needs a value for each of its final results; omit it for your own question, also one that asks only some parts of a Problem.",
    ),
});

/**
 * What `grade` takes: the verdict on the Student's answer to the open
 * Question. `results` and `help` are required: with every field optional and
 * a `noAnswer` flag beside them, MiMo sent `finalValues` without `results` in
 * 4 of 4 replays of a staging reply (2026-11-09), and graded in 4 of 4 with
 * this schema and `closeQuestion` for a Question the Student moved on from.
 */
const gradeInputSchema = z.object({
  results: z
    .array(
      z.object({
        position: z
          .number()
          .int()
          .describe("The part's position: 1 for the first."),
        result: z
          .enum(["full", "partial", "wrong", "unanswered"])
          .describe(
            "full: right; partial: the right idea with a gap or slip; wrong: wrong; unanswered: the Student left it empty.",
          ),
        note: z
          .string()
          .max(300)
          .describe(
            "One line the Student reads beside the part: what was right, or what to look at again.",
          ),
      }),
    )
    .min(1)
    .max(MAX_PARTS)
    .describe("One result for each part of the question, each part once."),
  help: z
    .enum(["none", "some", "solution_shown"])
    .describe(
      "How much you helped on this question: none when the Student answered without your hints, some (hints or corrections before the answer, and the first task on KCs you explained just before it), or solution_shown when you showed or walked through the solution, before the answer or in this reply.",
    ),
  finalValues: z
    .array(
      z.object({
        label: z
          .string()
          .max(200)
          .nullish()
          .describe(
            "The label of the final result it answers; may be left out when the question has one.",
          ),
        value: z
          .string()
          .max(MAX_ANSWER_LENGTH)
          .describe(
            'The Student\'s value as mathjs, such as "17.5 kN", "[[1, 2], [0, 1]]", "[2, -3]", "n + 1" or "3 + 4i".',
          ),
      }),
    )
    .max(10)
    .nullish()
    .describe(
      "For a question with final results: the Student's final value for each one they gave, even when it looks wrong. Leave out a result the Student gave no value for.",
    ),
});

type GradeInput = z.infer<typeof gradeInputSchema>;

export type QuestionToGrade = {
  id: string;
  /** The live KCs it tests. */
  kcIds: string[];
  /** The KCs it tested that were retired since, which get no Attempt. */
  retiredKcIds: string[];
  /**
   * Its parts in order, each with the KC it tests (null once deleted);
   * empty for a Question without parts.
   */
  parts: Array<{ position: number; kcId: string | null }>;
  answered: boolean;
  graded: boolean;
  /** Whether its Study session has ended, which closes it for grading. */
  sessionEnded: boolean;
  /** Its Exercise's or generated Problem's answer keys; null without any. */
  finalAnswers: AnswerKey[] | null;
};

/** The worst check of the final values: null when the question has no keys. */
export type FinalValueCheck = AnswerCheck | null;

const rememberInputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(300)
    .regex(/^[^\r\n]+$/, "One line, without line breaks.")
    .describe("One line of at most 300 characters, without line breaks."),
});

const searchMaterialsInputSchema = z.object({
  query: rememberInputSchema.shape.text.describe(
    "What to look for, in one line of at most 300 characters, as a question or a phrase from the Materials.",
  ),
});

const showReadingInputSchema = z.object({
  sectionId: z.string().describe("The id of a Reading section of a Topic."),
  purpose: rememberInputSchema.shape.text.describe(
    "The question the reading answers, which the Student reads it for: one line of at most 300 characters.",
  ),
});

/**
 * What the tools do. A refusal, such as an id that is no KC of the Course,
 * throws a `TutorToolError`, whose message the model sees.
 */
export type TutorToolActions = {
  /**
   * A Topic of the Course with the source chunks of `kcIds`, or of all its
   * KCs when none; null for an id that is no Topic of the Course. Without a
   * Topic, only the KCs of `kcIds`, with their source chunks. Throws a
   * `TutorToolError` for a KC that is not of the Topic, or of the Course.
   */
  getTopic: (
    topicId: string | null,
    kcIds?: string[],
  ) => Promise<TopicView | null>;
  /**
   * Up to 4 embedded chunks of the Course nearest to the query by meaning,
   * nearest first. Throws a `TutorToolError` when it can't search.
   */
  searchMaterials: (query: string) => Promise<SourceChunkView[]>;
  /** A note, without Problems, tells the model why there are none. */
  findProblems: (
    kcIds: string[],
  ) => Promise<{ problems: ProblemView[]; note?: string }>;
  /** A Reading section of the Course; null for any other id. */
  findReading: (sectionId: string) => Promise<ReadingView | null>;
  remember: (text: string) => Promise<void>;
  /**
   * Stores a question in the Chat's Study session; returns its id, and the
   * Problem it poses, which the Chat shows. Throws a `TutorToolError` for a
   * `problemId` that is no Problem of the Course.
   */
  ask: (question: {
    prompt: string;
    parts: Array<{
      prompt: string;
      kcId: string;
      form: PartForm;
      options: string[] | null;
    }>;
    problemId: string | null;
  }) => Promise<{ questionId: string; problem: AskedProblem | null }>;
  /** The newest Question of the Chat's Study session; null without one. */
  findQuestion: () => Promise<QuestionToGrade | null>;
  /**
   * Marks the question graded, stores each part's result and note and one
   * attempt per KC of `results`; returns each KC's stored result, or null
   * when it was graded in the meantime.
   */
  saveGrade: (grade: {
    questionId: string;
    help: AttemptHelp;
    parts: GradedPart[];
    results: Array<{ kcId: string; result: AttemptResult }>;
    check: FinalValueCheck;
  }) => Promise<GradedKc[] | null>;
  /**
   * Marks the question graded without attempts; false when it was graded
   * in the meantime.
   */
  closeQuestion: (questionId: string) => Promise<boolean>;
  compute: (program: string) => Promise<ProgramRun>;
};

export class TutorToolError extends Error {
  override name = "TutorToolError";
}

export function tutorTools(actions: TutorToolActions) {
  return {
    getTopic: tool({
      description:
        "Read a Topic of this Course before teaching it: its central question, its KCs in order with their description, recall band (new, strong, fading or weak), recall today (0 to 1), what each assumes from outside the Materials and the KCs of the Topic it builds on, its anchors with their band, its Reading sections, up to 5 later Topics that build on it and how many old-exam Exercises test its KCs. The KCs you give in kcIds (all of the Topic's when omitted) come with up to 3 source chunks from the Course's Materials in reading order, each with its Markdown, Material, pages and a link to cite. Without a topicId, it reads the KCs in kcIds alone, with the same facts and source chunks.",
      inputSchema: getTopicInputSchema,
      execute: async ({ topicId, kcIds }) => {
        if (!topicId && !kcIds) {
          throw new TutorToolError(
            "Give a topicId, or the kcIds of the KCs to read without one.",
          );
        }
        const topic = await actions.getTopic(
          topicId || null,
          kcIds ?? undefined,
        );
        if (!topic) {
          throw new TutorToolError(
            `${topicId} is no Topic id of this Course: use the id of one of its Topics.`,
          );
        }
        return topic;
      },
    }),
    searchMaterials: tool({
      description:
        "Search all of this Course's Materials by meaning: up to 4 chunks nearest to your query, each with its chunk id, Markdown, Material, pages and a link to cite. Use it when getTopic's source chunks don't answer a question, or to check a KC's description against the Materials. Chunks of a Material still being parsed may be missing.",
      inputSchema: searchMaterialsInputSchema,
      execute: async ({ query }) => {
        const chunks = await actions.searchMaterials(query);
        return chunks.length > 0
          ? { chunks }
          : {
              chunks,
              note: "No chunk of this Course is searchable yet: its Materials are not parsed, or have no text.",
            };
      },
    }),
    findProblems: tool({
      description:
        "Find up to 3 Problems for the given KCs that test any of them: unseen ones first, then those not asked in the last 14 days; Exercises of this Course first, then Problems generated for it, ranked to vary and step up in difficulty. Each comes with its source (old_exam, exercise, or a generated variant of an Exercise or new Problem), its question, the KCs it tests, a link to cite (null for a generated Problem) and its solution, labelled with where it comes from. Pose the Problem you pick through ask with its problemId, never as text; never show the solution before the Student has tried. A generated solution without a program may be wrong: check it yourself before relying on it.",
      inputSchema: kcIdsInputSchema,
      execute: async ({ kcIds }) => actions.findProblems(kcIds),
    }),
    remember: tool({
      description:
        "Save one line to your Memory of this Student in this Course, which you read in every later Chat: something that will help you tutor them, such as a preference, how they like to learn or their context. The date is added for you.",
      inputSchema: rememberInputSchema,
      execute: async ({ text }) => {
        await actions.remember(text);
        return { ok: true };
      },
    }),
    ask: tool({
      description:
        "Ask the Student a graded question in parts: the Chat shows a card with the case and then each part with its own field, and it ends your reply. The Student fills in what they can and submits all parts at once; that Submit, or a photo they send, is their answer, which you grade with grade. Messages they type meanwhile are side questions, and the Question stays open. With a problemId, the card shows the Problem's own statement and page as the case in place of your prompt. Write any lead-in before calling it, and don't repeat the question in your text. Refused while the open Question is answered but not graded: grade it first.",
      inputSchema: askInputSchema,
      execute: async ({ problemId, parts, ...question }) => {
        parts.forEach(({ form, options }, index) => {
          if ((form === "choice") !== (options !== null)) {
            throw new TutorToolError(
              `Part ${index + 1}: give options (2 to 4) for form choice, and for no other form.`,
            );
          }
        });
        const open = await actions.findQuestion();
        if (open && open.answered && !open.graded) {
          throw new TutorToolError(
            "The Student answered the open Question: grade it first, or close it with closeQuestion when they moved on.",
          );
        }
        const { questionId, problem } = await actions.ask({
          ...question,
          parts,
          problemId: problemId ?? null,
        });
        return problem === null ? { questionId } : { questionId, problem };
      },
    }),
    showReading: tool({
      description:
        "Open a Reading section of the course's pages for the Student to read, with the question they read it for: it shows on a reading card, opens the pages beside the Chat and ends your reply. Write a short lead-in first, and don't repeat the question in your text. Returns the section's label and its chunks' Markdown in order, so you can ask about what they read.",
      inputSchema: showReadingInputSchema,
      execute: async ({ sectionId }) => showReading(actions, sectionId),
    }),
    grade: tool({
      description:
        "Grade the Student's answer to the open Question, the one you asked last with ask, before you give feedback: a result and a one-line note for each of its parts, how much you helped and, for a question with final results, the Student's final values. The card shows each part's result and note beside it, so your reply doesn't repeat them. When the Student moved on instead of answering, call closeQuestion instead. Code checks each value against its key: numbers and units at 1% tolerance, vectors and matrices element by element, expressions at sample points. On a mismatch every full part becomes partial. Each KC gets one Attempt, the worst of its answered parts; a KC whose parts are all unanswered gets none. Returns each part's stored result and note, each KC's id and stored result, the help and the check: match, mismatch, unchecked (a value code doesn't compare, or a result without a value) or null when the question has no final results.",
      inputSchema: gradeInputSchema,
      execute: async (input) => grade(actions, input),
    }),
    closeQuestion: tool({
      description:
        "Close the open Question without a grade when the Student moved on instead of answering it, when they found it unclear or misread it (then ask it again in clearer words), or when they say they have not seen a KC that is new to them and this session has not explained (then teach it). Records nothing about their knowledge.",
      inputSchema: z.object({}),
      execute: async () => {
        const question = await openQuestion(actions);
        if (!(await actions.closeQuestion(question.id))) {
          throw new TutorToolError(alreadyGraded);
        }
        return { ok: true };
      },
    }),
    compute: computeTool(actions.compute),
  };
}

async function showReading(
  actions: TutorToolActions,
  sectionId: string,
): Promise<ReadingView> {
  const section = await actions.findReading(sectionId);
  if (!section) {
    throw new TutorToolError(
      `${sectionId} is no Reading section of this Course: use a section id that getTopic lists.`,
    );
  }
  return section;
}

const alreadyGraded =
  "This question is already graded: its grade is recorded, so don't grade or close it again. Write your reply to the Student from that grade.";

async function openQuestion(
  actions: TutorToolActions,
): Promise<QuestionToGrade> {
  const question = await actions.findQuestion();
  if (!question) {
    throw new TutorToolError("There is no open Question: ask one first.");
  }
  if (question.graded) throw new TutorToolError(alreadyGraded);
  if (question.sessionEnded) {
    throw new TutorToolError(
      "This question's study session has ended, so it can't be graded or closed.",
    );
  }
  return question;
}

/**
 * The `grade` call's rules, on the session's open Question: one result for
 * each part of an answered Question, and the check of its final values
 * against its keys, which turns every `full` part into `partial` on a
 * mismatch. A `full` needs a value for every key, so each check runs. Each
 * live KC gets one Attempt from its parts (`attemptsFromParts`).
 */
async function grade(
  actions: TutorToolActions,
  input: GradeInput,
): Promise<{
  questionId: string;
  parts: GradedPart[];
  kcs: GradedKc[];
  help: AttemptHelp;
  check: FinalValueCheck;
}> {
  const question = await openQuestion(actions);
  if (!question.answered) {
    throw new TutorToolError(
      "The Student has not answered this question yet: wait for their answer.",
    );
  }
  if (question.parts.length === 0) {
    throw new TutorToolError(
      "This question has no parts, so it can't be graded: close it with closeQuestion, and ask again with parts.",
    );
  }
  const help = input.help;
  const positions = input.results.map(({ position }) => position);
  const expected = question.parts.map(({ position }) => position);
  if (
    new Set(positions).size < positions.length ||
    positions.length !== expected.length ||
    positions.some((position) => !expected.includes(position))
  ) {
    throw new TutorToolError(
      `Give one result for each part of the question, by its position, each once: ${expected.join(", ")}.`,
    );
  }
  const keys = question.finalAnswers ?? [];
  const checked = checkAnswers(keys, input.finalValues ?? []);
  if (!checked.ok) throw new TutorToolError(checked.error);
  const unvalued = keys.filter((_, index) => checked.checks[index] === null);
  if (
    unvalued.length > 0 &&
    input.results.some(({ result }) => result === "full")
  ) {
    throw new TutorToolError(
      `A full needs the Student's value for each final result, for the check: give it in finalValues for ${unvalued.map(({ label }) => `"${label}"`).join(", ")}, as the Student wrote it, and keep your results. Only when the answer has no value for it is no part full.`,
    );
  }
  const check = worstCheck(checked.checks);
  const parts = input.results
    .map(({ position, result, note }) => ({
      position,
      result:
        check === "mismatch" && result === "full"
          ? ("partial" as const)
          : result,
      note,
    }))
    .toSorted((a, b) => a.position - b.position);
  const kcs = await actions.saveGrade({
    questionId: question.id,
    help,
    parts,
    results: attemptsFromParts(question, parts),
    check,
  });
  if (!kcs) throw new TutorToolError(alreadyGraded);
  return { questionId: question.id, parts, kcs, help, check };
}

const SEVERITY: Record<AttemptResult, number> = {
  wrong: 0,
  partial: 1,
  full: 2,
};

/**
 * One Attempt per live KC of the question: the worst result of its answered
 * parts. A KC with only unanswered parts, a retired KC and a deleted one get
 * none.
 */
function attemptsFromParts(
  question: QuestionToGrade,
  graded: GradedPart[],
): Array<{ kcId: string; result: AttemptResult }> {
  const worst = new Map<string, AttemptResult>();
  for (const { position, kcId } of question.parts) {
    const result = graded.find((part) => part.position === position)?.result;
    if (!kcId || !question.kcIds.includes(kcId)) continue;
    if (result === undefined || result === "unanswered") continue;
    const before = worst.get(kcId);
    if (before === undefined || SEVERITY[result] < SEVERITY[before]) {
      worst.set(kcId, result);
    }
  }
  return [...worst].map(([kcId, result]) => ({ kcId, result }));
}

export type TutorTools = ReturnType<typeof tutorTools>;

/**
 * Ends a reply at a call that waits for the Student: a question (`ask`) or
 * a reading (`showReading`).
 */
export const endsReply = hasToolCall("ask", "showReading");
