/**
 * The extraction of one teaching unit (task `map`): the known KCs it
 * teaches again, the new KCs it teaches and their Prerequisites, checked in
 * code against the ids the call was offered.
 */

/** Something a KC uses that no KC of the Course teaches. */
type Assumption = { name: string; description: string };

/**
 * A new KC of an extraction: with the call's chunk ids in its answer, with
 * stored chunk ids once checked.
 */
export type ExtractedKc = {
  name: string;
  description: string;
  chunkIds: string[];
  assumes: Assumption[];
};

export type AnsweredExtraction = {
  repeats: Array<{ kcId: string; chunkIds: string[] }>;
  kcs: Array<{
    id: string;
    name: string;
    description: string;
    chunkIds: string[];
    prerequisites: string[];
    outside: Assumption[];
  }>;
};

/**
 * A checked extraction: new KCs; Prerequisites among them by index into
 * `kcs`; Prerequisites from known KCs by stored id; and the known KCs the
 * unit teaches again, by stored id with their stored chunk ids.
 */
export type UnitExtraction = {
  kcs: ExtractedKc[];
  prerequisites: Array<{ from: number; to: number }>;
  knownPrerequisites: Array<{ from: string; to: number }>;
  repeats: Array<{ kcId: string; chunkIds: string[] }>;
};

const MAX_NAME = 200;
const MAX_DESCRIPTION = 1000;
const MAX_OUTSIDE = 3;

/**
 * Checks an answer against the unit's chunks and the known KCs, `chunkIdOf`
 * and `knownIdOf` mapping the call's ids to stored ones: a KC keeps its
 * known chunk ids and is dropped without one; a repeat is dropped when it
 * names no known KC or no known chunk; a Prerequisite is dropped when its
 * id names neither a known KC nor another kept new KC.
 */
export function checkExtraction(
  answer: AnsweredExtraction,
  chunkIdOf: ReadonlyMap<string, string>,
  knownIdOf: ReadonlyMap<string, string> = new Map(),
): UnitExtraction {
  const storedChunks = (ids: readonly string[]) => [
    ...new Set(ids.flatMap((id) => chunkIdOf.get(id) ?? [])),
  ];
  const kept = answer.kcs.flatMap((kc) => {
    const chunkIds = storedChunks(kc.chunkIds);
    const name = kc.name.trim().slice(0, MAX_NAME);
    const description = kc.description.trim().slice(0, MAX_DESCRIPTION);
    if (chunkIds.length === 0 || !name || !description) return [];
    const assumes = kc.outside
      .flatMap((assumed) => {
        const name = assumed.name.trim().slice(0, MAX_NAME);
        const description = assumed.description
          .trim()
          .slice(0, MAX_DESCRIPTION);
        return name && description ? [{ name, description }] : [];
      })
      .slice(0, MAX_OUTSIDE);
    return [{ answer: kc, kc: { name, description, chunkIds, assumes } }];
  });

  const indexOf = new Map<string, number>();
  kept.forEach(({ answer }, index) => {
    const id = answer.id.trim();
    if (!indexOf.has(id)) indexOf.set(id, index);
  });
  const prerequisites: UnitExtraction["prerequisites"] = [];
  const knownPrerequisites: UnitExtraction["knownPrerequisites"] = [];
  kept.forEach(({ answer }, to) => {
    for (const id of new Set(answer.prerequisites.map((p) => p.trim()))) {
      const known = knownIdOf.get(id);
      const from = indexOf.get(id);
      if (known !== undefined) knownPrerequisites.push({ from: known, to });
      else if (from !== undefined && from !== to) {
        prerequisites.push({ from, to });
      }
    }
  });

  const repeated = new Map<string, Set<string>>();
  for (const repeat of answer.repeats) {
    const kcId = knownIdOf.get(repeat.kcId.trim());
    const chunkIds = storedChunks(repeat.chunkIds);
    if (kcId === undefined || chunkIds.length === 0) continue;
    const chunks = repeated.get(kcId) ?? new Set();
    for (const id of chunkIds) chunks.add(id);
    repeated.set(kcId, chunks);
  }
  return {
    kcs: kept.map(({ kc }) => kc),
    prerequisites,
    knownPrerequisites,
    repeats: [...repeated].map(([kcId, chunks]) => ({
      kcId,
      chunkIds: [...chunks],
    })),
  };
}
