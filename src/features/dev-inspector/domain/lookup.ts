import type {
  DevUnit,
  Snapshot,
  SnapshotChunk,
  SnapshotKc,
} from "@/features/dev-inspector/types";

/** Anchors of the developer page, so every part links to the others. */
export const anchor = {
  material: (id: string) => `material-${id}`,
  page: (materialId: string, page: number) => `page-${materialId}-${page}`,
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
  const chunk = new Map<string, SnapshotChunk>(
    snapshot.chunks.map((c) => [c.id, c]),
  );
  const kc = new Map<string, SnapshotKc>(snapshot.kcs.map((k) => [k.id, k]));
  const material = new Map(snapshot.materials.map((m) => [m.id, m]));

  const kcsOfChunk = new Map<string, string[]>();
  for (const k of snapshot.kcs) {
    for (const id of k.sources) push(kcsOfChunk, id, k.id);
  }
  const unitsOfChunk = new Map<string, DevUnit[]>();
  const unitsOfKc = new Map<string, DevUnit[]>();
  for (const unit of units) {
    for (const id of unit.chunkIds) push(unitsOfChunk, id, unit);
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
  for (const topic of snapshot.topics) {
    for (const id of topic.kcIds) push(topicsOfKc, id, topic.id);
  }
  const topic = new Map(snapshot.topics.map((t) => [t.id, t]));
  const exerciseOfChunk = new Map(
    snapshot.exercises.map((e) => [e.questionChunkId, e.id]),
  );

  return {
    chunk,
    kc,
    material,
    topic,
    kcsOfChunk,
    unitsOfChunk,
    unitsOfKc,
    requires,
    requiredBy,
    kcsOfExercise,
    exercisesOfKc,
    topicsOfKc,
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
