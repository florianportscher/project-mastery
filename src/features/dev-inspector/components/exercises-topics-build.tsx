import { ChunkMarkdown } from "@/features/dev-inspector/components/chunk-markdown";
import {
  ChapterRefs,
  ChunkRefs,
  Flag,
  Json,
  KcRefs,
  Row,
  Section,
} from "@/features/dev-inspector/components/inspector-parts";
import { anchor, type Lookup } from "@/features/dev-inspector/domain/lookup";
import type { Snapshot } from "@/features/dev-inspector/types";

/** Each Exercise with its question, solution, KCs and final answers. */
export function ExercisesSection({
  snapshot,
  lookup,
}: {
  snapshot: Snapshot;
  lookup: Lookup;
}) {
  return (
    <Section id="exercises" title="Exercises">
      {snapshot.exercises.map((exercise) => {
        const kcs = lookup.kcsOfExercise.get(exercise.id) ?? [];
        const answers = Array.isArray(exercise.finalAnswers)
          ? (exercise.finalAnswers as Array<{ label?: string; value?: string }>)
          : [];
        return (
          <div
            key={exercise.id}
            id={anchor.exercise(exercise.id)}
            className="scroll-mt-4 space-y-0.5 rounded border p-2 target:border-yellow-500"
          >
            <div className="flex flex-wrap items-baseline gap-2 text-sm font-medium">
              #{exercise.position} · difficulty {exercise.difficulty}
              {kcs.length === 0 && <Flag>no KCs</Flag>}
            </div>
            <Row label="Question">
              <ChunkRefs ids={[exercise.questionChunkId]} lookup={lookup} />{" "}
              <ChunkMarkdown chunkId={exercise.questionChunkId} />
            </Row>
            <Row label="Solution">
              {exercise.solutionChunkId ? (
                <>
                  <ChunkRefs ids={[exercise.solutionChunkId]} lookup={lookup} />{" "}
                  <ChunkMarkdown chunkId={exercise.solutionChunkId} />
                </>
              ) : (
                <span className="text-muted-foreground">none</span>
              )}
            </Row>
            <Row label="KCs">
              <KcRefs ids={kcs} lookup={lookup} />
            </Row>
            <Row label="Final answers">
              {answers.length === 0 ? (
                <span className="text-muted-foreground">none</span>
              ) : (
                <span className="font-mono text-xs">
                  {answers.map((a) => `${a.label} = ${a.value}`).join("; ")}
                </span>
              )}
            </Row>
          </div>
        );
      })}
    </Section>
  );
}

/** The Topic tree with each Topic's KCs and Chapters. */
export function TopicsSection({
  snapshot,
  lookup,
}: {
  snapshot: Snapshot;
  lookup: Lookup;
}) {
  const childrenOf = Map.groupBy(snapshot.topics, (t) => t.parentId ?? "");
  const node = (topic: Snapshot["topics"][number]) => (
    <div
      key={topic.id}
      id={anchor.topic(topic.id)}
      className="scroll-mt-4 border-l pl-3 target:bg-yellow-50 dark:target:bg-yellow-950"
    >
      <div className="text-sm font-medium">{topic.name}</div>
      {topic.centralQuestion && (
        <p className="text-xs text-muted-foreground">{topic.centralQuestion}</p>
      )}
      {topic.chapterIds.length > 0 && (
        <Row label="Chapters">
          <ChapterRefs ids={topic.chapterIds} lookup={lookup} />
        </Row>
      )}
      {topic.kcIds.length > 0 && (
        <Row label="KCs">
          <KcRefs ids={topic.kcIds} lookup={lookup} />
        </Row>
      )}
      {(childrenOf.get(topic.id) ?? []).map(node)}
    </div>
  );
  return (
    <Section id="topics" title="Topics">
      {(childrenOf.get("") ?? []).map(node)}
    </Section>
  );
}

/** The build's state and its stored check report. */
export function BuildSection({ snapshot }: { snapshot: Snapshot }) {
  const build = snapshot.build;
  const time = (value: string | null) =>
    value ? new Date(value).toLocaleString("en") : "–";
  return (
    <Section id="build" title="Build">
      {build ? (
        <div className="space-y-0.5">
          <Row label="Status">
            {build.status}
            {build.needsUpdate && " · needs update"}
          </Row>
          {build.failureReason && (
            <Row label="Failure">
              <Flag>{build.failureReason}</Flag>
            </Row>
          )}
          <Row label="Started">{time(build.startedAt)}</Row>
          <Row label="Finished">{time(build.finishedAt)}</Row>
          <Row label="Heartbeat">{time(build.heartbeatAt)}</Row>
          <Json label="Check report" value={build.checkReport} open />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Never built.</p>
      )}
    </Section>
  );
}
