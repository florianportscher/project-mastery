/** The most later Topics a Topic's facts name. */
const MAX_BUILDING_TOPICS = 5;

/**
 * What the AI is told of why a Topic matters, for the proposal's Topic in
 * the tutor context and for `getTopic`.
 */
export type TopicFacts = {
  /** Up to 5 later Topics that build on it, by the Course map's arrows. */
  buildingTopics: string[];
  /** How many old-exam Exercises test any of its KCs. */
  oldExamExercises: number;
  /** For each KC, the KCs of the same Topic it builds on, by name. */
  kcBuildsOn: Record<string, string[]>;
};

/**
 * The facts of each Topic with KCs of its own, by Topic id. `arrows` are
 * the Course map's Topic arrows; `exercises` leave out the reserved exam's.
 */
export function topicFacts(input: {
  topics: Array<{ id: string; name: string; kcs: string[] }>;
  kcNames: Map<string, string>;
  arrows: Array<{ source: string; target: string }>;
  prerequisites: Array<{ from: string; to: string }>;
  exercises: Array<{ questionChunk: string; kcs: string[] }>;
  examChunkIds: string[];
}): Map<string, TopicFacts> {
  const nameOf = new Map(input.topics.map((topic) => [topic.id, topic.name]));
  const examChunks = new Set(input.examChunkIds);
  const oldExam = input.exercises.filter(({ questionChunk }) =>
    examChunks.has(questionChunk),
  );
  return new Map(
    input.topics.map((topic) => {
      const own = new Set(topic.kcs);
      const kcBuildsOn: Record<string, string[]> = {};
      for (const { from, to } of input.prerequisites) {
        if (!own.has(from) || !own.has(to)) continue;
        (kcBuildsOn[to] ??= []).push(input.kcNames.get(from) ?? from);
      }
      return [
        topic.id,
        {
          buildingTopics: [
            ...new Set(
              input.arrows.flatMap(({ source, target }) =>
                source === topic.id ? (nameOf.get(target) ?? []) : [],
              ),
            ),
          ].slice(0, MAX_BUILDING_TOPICS),
          oldExamExercises: oldExam.filter(({ kcs }) =>
            kcs.some((id) => own.has(id)),
          ).length,
          kcBuildsOn,
        },
      ];
    }),
  );
}
