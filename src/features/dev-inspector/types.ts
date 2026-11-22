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
  chunks: SnapshotChunk[];
  extractions: SnapshotExtraction[];
  kcs: SnapshotKc[];
  prerequisites: Array<{ from: string; to: string }>;
  exercises: Array<{
    id: string;
    position: number;
    questionChunkId: string;
    questionChunkIds: string[];
    solutionChunkIds: string[];
    examId: string | null;
    difficulty: number;
    finalAnswers: unknown;
  }>;
  exams: Array<{
    id: string;
    name: string;
    position: number;
    confirmed: boolean | null;
    asked: boolean;
  }>;
  exerciseKcs: Array<{ exerciseId: string; kcId: string }>;
  topics: Array<{
    id: string;
    parentId: string | null;
    position: number;
    name: string;
    centralQuestion: string | null;
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

export type SnapshotChunk = {
  id: string;
  materialId: string;
  /** The heading it follows; null before its Material's first. */
  heading: string | null;
  position: number;
  label: string;
  pageFrom: number;
  pageTo: number;
  chars: number;
};

type SnapshotExtraction = {
  id: string;
  materialId: string;
  kind: string;
  batch: number;
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
 * A batch of the build as the current chunks form it, keyed as
 * `unit_extractions` is (`unitKey`), with its stored extraction if any.
 */
export type DevUnit = {
  key: string;
  kind: "content" | "exercise";
  materialId: string;
  batch: number;
  /** Where it is, as the check report names it: "Material p. 3–7". */
  title: string;
  /** A teaching batch's chunks; an exercise batch's question chunks. */
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
  | { status: "ok"; calls: DevCall[]; truncated: boolean }
  | { status: "untraced" }
  | { status: "error"; message: string };

export type DevCallDetail = DevCall & { input: unknown; output: unknown };

/** The suspect spots of a build, by the ids the page marks. */
export type Flags = {
  /** `content` chunks that no live KC cites. */
  chunksWithoutKcs: Set<string>;
  /** Units the stored check report names, by key, with what it says. */
  unitsInReport: Map<string, string[]>;
  /** Live KCs without a source chunk. */
  kcsWithoutSources: Set<string>;
  /** Live KCs the check report pairs as alike, with their partners. */
  nearDuplicates: Map<string, string[]>;
  /** Teaching units whose live KCs cite less than the bar, with their coverage. */
  unitsBelowCoverage: Map<string, number>;
  /** Pages read without units, as `pageKey`. */
  unreadPages: Set<string>;
};
