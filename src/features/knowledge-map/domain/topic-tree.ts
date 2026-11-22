/**
 * The Topic tree (#351): the rules that turn the tree call's answer, or the
 * stored tree, into the Topics a build stores. A Topic is one subject
 * learned as a block; every live KC sits in exactly one Topic, and the tree
 * is at most two levels deep. Pure code.
 */

/** The most characters of a Topic name. */
export const MAX_TOPIC_NAME = 80;
const MAX_CENTRAL_QUESTION = 500;
/** The deepest level of the tree. */
const MAX_LEVEL = 2;

/**
 * A Topic as the tree call proposes it, in a flat list in tree order: a
 * Topic's parent is the nearest earlier Topic with a lower `level`.
 */
export type ProposedTopic = {
  level: number;
  name: string;
  /** The KCs it holds itself. */
  kcIds: string[];
  centralQuestion: string;
  /** The stored Topic it continues; null for a new one. */
  continues: string | null;
};

export type PlannedTopic = {
  /** The stored Topic it continues; null inserts one. */
  id: string | null;
  /** The index of its parent in the plan; null at the top. */
  parent: number | null;
  name: string;
  /** Null exactly when it holds no KCs of its own. */
  centralQuestion: string | null;
  /** Its own KCs, in Course order. */
  kcs: string[];
};

export type TreeKc = {
  id: string;
  /** The name of its first source's Material. */
  material: string;
};

export type StoredTreeTopic = {
  id: string;
  parentId: string | null;
  name: string;
  centralQuestion: string | null;
  /** Its own KCs. */
  kcs: string[];
};

/** The stored tree as a proposal, so a build without a call keeps it. */
export function storedAsProposed(stored: StoredTreeTopic[]): ProposedTopic[] {
  const parentOf = new Map(stored.map((topic) => [topic.id, topic.parentId]));
  const depth = (id: string): number => {
    const parent = parentOf.get(id);
    return parent ? depth(parent) + 1 : 1;
  };
  return stored.map((topic) => ({
    level: depth(topic.id),
    name: topic.name,
    kcIds: topic.kcs,
    centralQuestion: topic.centralQuestion ?? "",
    continues: topic.id,
  }));
}

type Node = { topic: ProposedTopic; kcs: string[]; children: Node[] };

const newNode = (name: string): Node => ({
  topic: { level: 1, name, kcIds: [], centralQuestion: "", continues: null },
  kcs: [],
  children: [],
});

/**
 * The Topics to store from a proposed tree. Levels below 2 become 2. Each
 * KC goes to the first Topic naming it; a KC no Topic names goes to the
 * Topic of the KC before it in Course order, or after it for the first.
 * When no Topic names a KC, each Material's KCs make a Topic named by the
 * Material. A Topic left with no KCs and no children goes. A Topic keeps
 * the stored id it continues when that is one of `stored` and no earlier
 * Topic took it; a stored Topic no Topic continues is then continued by
 * the free Topic sharing most KCs with it.
 */
export function planTopicTree({
  proposed,
  kcs,
  stored,
}: {
  proposed: ProposedTopic[];
  kcs: TreeKc[];
  stored: ReadonlyArray<Pick<StoredTreeTopic, "id" | "kcs">>;
}): PlannedTopic[] {
  const live = new Set(kcs.map((kc) => kc.id));

  // The tree, from levels; each KC in the first Topic naming it.
  const roots: Node[] = [];
  let parent: Node | undefined;
  const holder = new Map<string, Node>();
  for (const topic of proposed) {
    const level = Math.min(Math.max(topic.level, 1), MAX_LEVEL);
    const node: Node = { topic: { ...topic, level }, kcs: [], children: [] };
    for (const id of topic.kcIds) {
      if (live.has(id) && !holder.has(id)) holder.set(id, node);
    }
    if (level === 1 || !parent) {
      roots.push(node);
      parent = node;
    } else {
      parent.children.push(node);
    }
  }

  // KCs no Topic names follow their neighbour in Course order.
  if (holder.size === 0) {
    const ofMaterial = new Map<string, Node>();
    for (const kc of kcs) {
      let node = ofMaterial.get(kc.material);
      if (!node) {
        node = newNode(kc.material);
        ofMaterial.set(kc.material, node);
        roots.push(node);
      }
      holder.set(kc.id, node);
    }
  }
  const firstHeld = kcs.find((kc) => holder.has(kc.id));
  let previous = firstHeld && holder.get(firstHeld.id);
  for (const kc of kcs) {
    const node = holder.get(kc.id) ?? previous!;
    node.kcs.push(kc.id);
    previous = node;
  }

  // Empty Topics go, from the leaves up.
  const prune = (nodes: Node[]): Node[] =>
    nodes.flatMap((node) => {
      node.children = prune(node.children);
      return node.kcs.length > 0 || node.children.length > 0 ? [node] : [];
    });
  const kept = prune(roots);
  const nodes = kept.flatMap((node) => [node, ...node.children]);

  // The stored id each Topic keeps.
  const storedIds = new Set(stored.map((topic) => topic.id));
  const idOf = new Map<Node, string>();
  const taken = new Set<string>();
  for (const node of nodes) {
    const { continues } = node.topic;
    if (continues && storedIds.has(continues) && !taken.has(continues)) {
      idOf.set(node, continues);
      taken.add(continues);
    }
  }
  for (const topic of stored) {
    if (taken.has(topic.id)) continue;
    let best: { node: Node; shared: number } | undefined;
    for (const node of nodes) {
      if (idOf.has(node)) continue;
      const shared = node.kcs.filter((id) => topic.kcs.includes(id)).length;
      if (shared > (best?.shared ?? 0)) best = { node, shared };
    }
    if (best) {
      idOf.set(best.node, topic.id);
      taken.add(topic.id);
    }
  }

  const materialOf = new Map(kcs.map((kc) => [kc.id, kc.material]));
  const plan: PlannedTopic[] = [];
  const visit = (node: Node, parent: number | null) => {
    const fallback = materialOf.get(node.kcs[0] ?? "") ?? "Topic";
    const name = node.topic.name.trim().slice(0, MAX_TOPIC_NAME) || fallback;
    const own = node.kcs.length > 0;
    const index = plan.length;
    plan.push({
      id: idOf.get(node) ?? null,
      parent,
      name,
      centralQuestion: own
        ? node.topic.centralQuestion.trim().slice(0, MAX_CENTRAL_QUESTION) ||
          name
        : null,
      kcs: node.kcs,
    });
    for (const child of node.children) visit(child, index);
  };
  for (const root of kept) visit(root, null);
  return plan;
}

/**
 * A Topic's own id, then its ancestors' up to the top, from the Topics'
 * parents by id.
 */
export function topicLineage(
  topicId: string,
  parentOf: ReadonlyMap<string, string | null>,
): string[] {
  const lineage: string[] = [];
  for (
    let id: string | null | undefined = topicId;
    id && !lineage.includes(id);
    id = parentOf.get(id)
  ) {
    lineage.push(id);
  }
  return lineage;
}
