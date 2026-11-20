import type {
  DevUnit,
  Snapshot,
  SnapshotChapter,
  SnapshotChunk,
  SnapshotKc,
} from "@/features/dev-inspector/types";

/** Anchors of the developer page, so every part links to the others. */
export const anchor = {
  material: (id: string) => `material-${id}`,
  page: (materialId: string, page: number) => `page-${materialId}-${page}`,
  chapter: (id: string) => `chapter-${id}`,
  chunk: (id: string) => `chunk-${id}`,
  unit: (key: string) => `unit-${key.replaceAll("/", "-")}`,
  kc: (id: string) => `kc-${id}`,
  exercise: (id: string) => `exercise-${id}`,
  topic: (id: string) => `topic-${id}`,
  call: (id: string) => `call-${id}`,
};

/** The snapshot indexed every way the page links its parts. */
export type Lookup = ReturnType<typeof buildLookup>;

const push = <K, V>(map: Map<K, V[]>, key: K, value: V) =>
  map.set(key, [...(map.get(key) ?? []), value]);

export function buildLookup(snapshot: Snapshot, units: readonly DevUnit[]) {
  const chapter = new Map<string, SnapshotChapter>(
    snapshot.chapters.map((c) => [c.id, c]),
  );
  const chunk = new Map<string, SnapshotChunk>(
    snapshot.chunks.map((c) => [c.id, c]),
  );
  const kc = new Map<string, SnapshotKc>(snapshot.kcs.map((k) => [k.id, k]));
  const material = new Map(snapshot.materials.map((m) => [m.id, m]));

  const chunksOfChapter = new Map<string, SnapshotChunk[]>();
  const rootOf = new Map(
    snapshot.chapters
      .filter((c) => c.parentId === null)
      .map((c) => [c.materialId, c.id]),
  );
  for (const c of snapshot.chunks) {
    const id = c.chapterId ?? rootOf.get(c.materialId);
    if (id) push(chunksOfChapter, id, c);
  }
  const children = new Map<string, SnapshotChapter[]>();
  for (const c of snapshot.chapters) {
    if (c.parentId) push(children, c.parentId, c);
  }

  const kcsOfChunk = new Map<string, string[]>();
  for (const k of snapshot.kcs) {
    for (const id of k.sources) push(kcsOfChunk, id, k.id);
  }
  const unitsOfChunk = new Map<string, DevUnit[]>();
  const unitsOfChapter = new Map<string, DevUnit[]>();
  const unitsOfKc = new Map<string, DevUnit[]>();
  for (const unit of units) {
    for (const id of unit.chunkIds) push(unitsOfChunk, id, unit);
    for (const id of unit.chapterIds) push(unitsOfChapter, id, unit);
    for (const id of unit.extraction?.kcIds ?? []) push(unitsOfKc, id, unit);
  }

  const requires = new Map<string, string[]>();
  const requiredBy = new Map<string, string[]>();
  for (const link of snapshot.prerequisites) {
    push(requires, link.to, link.from);
    push(requiredBy, link.from, link.to);
  }
  const kcsOfExercise = new Map<string, string[]>();
  const exercisesOfKc = new Map<string, string[]>();
  for (const link of snapshot.exerciseKcs) {
    push(kcsOfExercise, link.exerciseId, link.kcId);
    push(exercisesOfKc, link.kcId, link.exerciseId);
  }
  const topicsOfKc = new Map<string, string[]>();
  const topicsOfChapter = new Map<string, string[]>();
  for (const topic of snapshot.topics) {
    for (const id of topic.kcIds) push(topicsOfKc, id, topic.id);
    for (const id of topic.chapterIds) push(topicsOfChapter, id, topic.id);
  }
  const topic = new Map(snapshot.topics.map((t) => [t.id, t]));
  const exerciseOfChunk = new Map(
    snapshot.exercises.map((e) => [e.questionChunkId, e.id]),
  );

  return {
    chapter,
    chunk,
    kc,
    material,
    topic,
    chunksOfChapter,
    children,
    kcsOfChunk,
    unitsOfChunk,
    unitsOfChapter,
    unitsOfKc,
    requires,
    requiredBy,
    kcsOfExercise,
    exercisesOfKc,
    topicsOfKc,
    topicsOfChapter,
    exerciseOfChunk,
  };
}

/** The first chunk of a Material that holds the page, to link the page to. */
export function chunkOnPage(
  snapshot: Snapshot,
  materialId: string,
  page: number,
): SnapshotChunk | undefined {
  return snapshot.chunks.find(
    (c) =>
      c.materialId === materialId && c.pageFrom <= page && page <= c.pageTo,
  );
}
