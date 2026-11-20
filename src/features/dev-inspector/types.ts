/**
 * What `course_build_snapshot` returns: everything the parse and build
 * stored for one Course, without chunk Markdown. The SQL function defines
 * this shape; `agent inspect` reads the same jsonb.
 */
export type Snapshot = {
  course: { id: string; name: string; language: string | null };
  materials: Array<{
    id: string;
    name: string;
    position: number;
    mediaType: string;
    parseStatus: string;
    parseFailure: string | null;
    pagesTotal: number | null;
    language: string | null;
    notes: string | null;
  }>;
  /** One per page: the labels of the page units starting on it, or why it was skipped. */
  pages: Array<{
    materialId: string;
    pageNumber: number;
    skipped: string | null;
    labels: string[];
  }>;
  chapters: SnapshotChapter[];
  chunks: SnapshotChunk[];
  extractions: SnapshotExtraction[];
  kcs: SnapshotKc[];
  prerequisites: Array<{ from: string; to: string }>;
  exercises: Array<{
    id: string;
    position: number;
    questionChunkId: string;
    solutionChunkId: string | null;
    difficulty: number;
    finalAnswers: unknown;
  }>;
  exerciseKcs: Array<{ exerciseId: string; kcId: string }>;
  exerciseSolutions: Array<{
    exerciseChunkId: string;
    solutionChunkId: string | null;
    status: string;
  }>;
  topics: Array<{
    id: string;
    parentId: string | null;
    position: number;
    name: string;
    centralQuestion: string | null;
    chapterIds: string[];
    kcIds: string[];
  }>;
  build: {
    status: string;
    failureReason: string | null;
    startedAt: string;
    finishedAt: string | null;
    heartbeatAt: string;
    needsUpdate: boolean;
    checkReport: unknown;
  } | null;
};

export type SnapshotChapter = {
  id: string;
  materialId: string;
  parentId: string | null;
  depth: number;
  position: number;
  title: string;
  pageFrom: number;
  isExam: boolean | null;
  examProposed: boolean;
};

export type SnapshotChunk = {
  id: string;
  materialId: string;
  chapterId: string | null;
  position: number;
  label: string;
  pageFrom: number;
  pageTo: number;
  /** The length of its Markdown. */
  chars: number;
};

export type SnapshotExtraction = {
  id: string;
  chapterId: string;
  kind: string;
  unit: number;
  contentHash: string;
  kcIds: string[] | null;
  assumesMatched: boolean;
  createdAt: string;
  output: unknown;
};

export type SnapshotKc = {
  id: string;
  name: string;
  description: string;
  origin: string;
  position: number;
  assumes: unknown;
  retiredAt: string | null;
  sources: string[];
};

/**
 * A Chapter unit of the build as the current chunks form it, keyed as
 * `chapter_extractions` is (`unitKey`), with its stored extraction if any.
 */
export type DevUnit = {
  key: string;
  kind: "content" | "exercise";
  materialId: string;
  chapterId: string;
  unit: number;
  chapterIds: string[];
  chunkIds: string[];
  extraction: SnapshotExtraction | null;
};

/**
 * One traced parse or build call of the Course, from Langfuse, without its
 * input and output.
 */
export type DevCall = {
  id: string;
  /** The trace name, such as `extract-chapter`. */
  name: string;
  model: string | null;
  startTime: string;
  endTime: string | null;
  level: string;
  statusMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  cost: number | null;
  materialId: string | null;
  unitKey: string | null;
};

/**
 * The Course's calls, or why there are none: no Langfuse keys, or Langfuse
 * did not answer.
 */
export type DevCalls =
  | { status: "ok"; calls: DevCall[] }
  | { status: "untraced" }
  | { status: "error"; message: string };

/** One call with what it sent and answered. */
export type DevCallDetail = DevCall & { input: unknown; output: unknown };

/** The suspect spots of a build, by the ids the page marks. */
export type Flags = {
  /** Chapters with `content` chunks of their own that no live KC cites. */
  chaptersWithoutKcs: Set<string>;
  /** Chapters the stored check report names, by id, with what it says. */
  chaptersInReport: Map<string, string[]>;
  /** Live KCs without a source chunk. */
  kcsWithoutSources: Set<string>;
  /** Live KCs the check report pairs as alike, with their partners. */
  nearDuplicates: Map<string, string[]>;
  /** Teaching units whose live KCs cite less than the bar, with their coverage. */
  unitsBelowCoverage: Map<string, number>;
  /** Pages read without units, as `pageKey`. */
  unreadPages: Set<string>;
};
