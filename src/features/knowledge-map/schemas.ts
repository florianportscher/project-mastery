import { z } from "zod";

// The course model of a Knowledge map (#51, #69). These schemas are the
// source of truth: the tables of the knowledge map migrations mirror them.

/** Stored row ids. */
const id = z.string().trim().min(1).max(100);
const name = z.string().trim().min(1).max(200);
const description = z.string().trim().min(1).max(1000);

/**
 * A knowledge component that its `sources` chunks teach. It comes from the
 * content, or from an exercise that needs it when the content does not
 * teach it. What the Materials assume but never teach is no KC: it is text
 * on the KC that assumes it (`kcs.assumes`), and a KC whose sources are
 * gone is retired.
 */
const kcSchema = z.object({
  id,
  name,
  description,
  origin: z.enum(["content", "exercise"]),
  sources: z.array(id),
});

/** `from` must be learned before `to`. */
const prerequisiteSchema = z.object({ from: id, to: id });

/**
 * One final result of an Exercise or a generated Problem, the key a
 * Student's final value is checked against (`domain/answer-keys.ts`): such
 * as `{ label: "Thrust", value: "17.5 kN", anyOrder: false }`.
 */
/** The longest answer key or final value read. */
export const MAX_ANSWER_LENGTH = 500;

export const answerKeySchema = z.object({
  label: z.string().trim().min(1).max(200),
  value: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
  anyOrder: z.boolean(),
});

/**
 * An Exercise: a whole task whose statement is its `questionChunks` (a stem
 * and all subtasks, the first being `questionChunk`, which keys it), with
 * its printed solutions' chunks (empty without any), the KCs it tests, a
 * difficulty from 1 (easy) to 3 (hard) and its answer keys as printed (null
 * without any).
 */
const exerciseSchema = z.object({
  id,
  questionChunk: id,
  questionChunks: z.array(id).min(1),
  solutionChunks: z.array(id),
  difficulty: z.int().min(1).max(3),
  kcs: z.array(id),
  finalAnswers: z.array(answerKeySchema).min(1).nullish(),
  /** The exam the build found it in; null or missing for none. */
  examId: id.nullish(),
  /** Whether that exam is an old exam the Student confirmed. */
  oldExam: z.boolean().optional(),
});

/**
 * A Course's stored map: its rows by id, KCs and Exercises citing chunk ids. Every reference must resolve and no Prerequisite may loop on
 * one KC.
 */
export const knowledgeMapSchema = z
  .object({
    kcs: z.array(kcSchema),
    prerequisites: z.array(prerequisiteSchema),
    /** In reading order. */
    exercises: z.array(exerciseSchema),
  })
  .superRefine((map, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    const kcs = new Set(map.kcs.map((kc) => kc.id));
    for (const exercise of map.exercises) {
      for (const kcId of exercise.kcs) {
        if (!kcs.has(kcId)) {
          issue(`exercise ${exercise.id} names an unknown KC ${kcId}`);
        }
      }
    }
    for (const link of map.prerequisites) {
      if (!kcs.has(link.from) || !kcs.has(link.to)) {
        issue(`link ${link.from} → ${link.to} names an unknown KC`);
      } else if (link.from === link.to) {
        issue(`link ${link.from} → ${link.to} loops on one KC`);
      }
    }
  });

/** What the build's checks found, stored with the map it checked. */
export const checkReportSchema = z.object({
  /**
   * Pages with teaching content that no live KC cites, per Material. A
   * report from before #351 has none.
   */
  uncitedPages: z
    .array(z.object({ material: z.string(), pages: z.array(z.number().int()) }))
    .default([]),
  /** Labels of Exercises that test no KC. */
  exercisesWithoutKcs: z.array(z.string()),
  /** KC pairs still alike enough to be duplicates after merging, by name. */
  duplicates: z.array(z.object({ a: name, b: name, similarity: z.number() })),
  /**
   * Teaching batches whose KCs cite less than MIN_UNIT_COVERAGE of them,
   * each as "Material p. 3–7", with the share they cite. A report from
   * before #351 has none.
   */
  unitsBelowCoverage: z
    .array(z.object({ unit: z.string(), coverage: z.number() }))
    .catch([]),
  /** Pages read without units, unreadable or uncovered, per Material. */
  unreadPages: z.array(
    z.object({ material: z.string(), pages: z.array(z.number().int()) }),
  ),
  /**
   * Units the build gave up on because their calls kept failing, each as
   * "Material p. 3–7": only the pieces that were answered are in the map.
   */
  unitsNotExtracted: z.array(z.string()).default([]),
  /**
   * True when a grouping call kept failing, so its exercise chunks became
   * Exercises of their own, without solutions.
   */
  exercisesNotGrouped: z.boolean().default(false),
});

/**
 * One Exercise of an exercise batch's extraction: its question and solution
 * chunks, the candidate KCs it tests by id and its new KCs by index into
 * the extraction's `kcs`, its final answers as printed and its printed
 * solution's line count.
 */
const extractedExerciseSchema = z.object({
  /** Its first question chunk, which keys the stored Exercise. */
  chunkId: z.string(),
  questionChunkIds: z.array(z.string()),
  solutionChunkIds: z.array(z.string()),
  notAnExercise: z.boolean(),
  kcIds: z.array(z.string()),
  newKcs: z.array(z.int()),
  finalAnswers: z.array(answerKeySchema),
  solutionLines: z.int().nullable(),
});

export type ExtractedExercise = z.infer<typeof extractedExerciseSchema>;

/**
 * A stored unit extraction (`unit_extractions.output`): its new KCs with
 * stored chunk ids, what each assumes from outside the Course
 * (`{ name, description }`) and, until they are stored, their vectors of
 * "name: description"; Prerequisites among them by index into `kcs`, and
 * from stored KCs by id (`knownPrerequisites`); the stored KCs the unit
 * teaches again, with the chunks that teach them there (`repeats`). An
 * exercise unit's also has its subtasks, whose new KCs are its `kcs`. A
 * partial extraction of a split unit (`domain/unit-pieces.ts`) names the
 * chunks its answered pieces read in `readChunkIds`.
 */
export const storedExtractionSchema = z.object({
  readChunkIds: z.array(z.string()).optional(),
  kcs: z.array(
    z.object({
      name,
      description,
      chunkIds: z.array(z.string()).min(1),
      assumes: z.array(z.object({ name, description })),
      embedding: z.array(z.number()).optional(),
    }),
  ),
  prerequisites: z.array(z.object({ from: z.int(), to: z.int() })),
  knownPrerequisites: z
    .array(z.object({ from: z.string(), to: z.int() }))
    .optional(),
  repeats: z
    .array(z.object({ kcId: z.string(), chunkIds: z.array(z.string()) }))
    .optional(),
  exercises: z.array(extractedExerciseSchema).optional(),
});

export type StoredExtraction = z.infer<typeof storedExtractionSchema>;

/**
 * What a KC assumes that no KC of the Course means (`kcs.assumes`): names
 * with a one-line description, unique by name.
 */
export const kcAssumesSchema = z.array(z.object({ name, description }));

/** The input of the Build button's Server Action. */
export const startKnowledgeMapBuildSchema = z.object({ courseId: z.uuid() });

export type KnowledgeMap = z.infer<typeof knowledgeMapSchema>;
export type CheckReport = z.infer<typeof checkReportSchema>;
