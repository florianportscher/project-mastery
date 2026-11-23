import { CallList } from "@/features/dev-inspector/components/calls";
import { ChunkMarkdown } from "@/features/dev-inspector/components/chunk-markdown";
import {
  ChunkRefs,
  Flag,
  Json,
  KcRefs,
  Row,
  Section,
} from "@/features/dev-inspector/components/inspector-parts";
import type { CallFlags } from "@/features/dev-inspector/domain/calls";
import { anchor, type Lookup } from "@/features/dev-inspector/domain/lookup";
import type { DevCalls, Snapshot } from "@/features/dev-inspector/types";

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
        const exam = snapshot.exams.find((e) => e.id === exercise.examId);
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
              {exam && (
                <span className="text-muted-foreground">
                  exam: {exam.name}
                  {exam.confirmed === true
                    ? " (confirmed)"
                    : exam.confirmed === false
                      ? " (rejected)"
                      : ""}
                </span>
              )}
            </div>
            <Row label="Question">
              <ChunkRefs ids={exercise.questionChunkIds} lookup={lookup} />{" "}
              {exercise.questionChunkIds.map((id) => (
                <ChunkMarkdown key={id} chunkId={id} />
              ))}
            </Row>
            <Row label="Solution">
              {exercise.solutionChunkIds.length > 0 ? (
                <>
                  <ChunkRefs ids={exercise.solutionChunkIds} lookup={lookup} />{" "}
                  {exercise.solutionChunkIds.map((id) => (
                    <ChunkMarkdown key={id} chunkId={id} />
                  ))}
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

/** The models of the build's calls (its start to its end, outside Chats), comma-separated. */
function modelsOf(calls: DevCalls, build: Snapshot["build"]): string {
  if (calls.status !== "ok" || !build) return "–";
  const from = Date.parse(build.startedAt);
  const to = build.finishedAt ? Date.parse(build.finishedAt) : Date.now();
  const models = new Set(
    calls.calls
      .filter((c) => {
        const start = Date.parse(c.startTime);
        return !c.inSession && start >= from && start <= to;
      })
      .flatMap((c) => (c.model ? [c.model] : [])),
  );
  return models.size > 0 ? [...models].join(", ") : "–";
}

export function BuildSection({
  snapshot,
  calls,
  callFlags,
  lookup,
}: {
  snapshot: Snapshot;
  calls: DevCalls;
  callFlags: CallFlags;
  lookup: Lookup;
}) {
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
          <Row label="Commit">{build.appCommit ?? "–"}</Row>
          <Row label="Models">{modelsOf(calls, build)}</Row>
          <Row label="Started">{time(build.startedAt)}</Row>
          <Row label="Finished">{time(build.finishedAt)}</Row>
          <Row label="Heartbeat">{time(build.heartbeatAt)}</Row>
          <Json label="Check report" value={build.checkReport} open />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Never built.</p>
      )}
      <h3 className="pt-2 text-sm font-semibold">Parse and build calls</h3>
      <CallList calls={calls} flags={callFlags} lookup={lookup} />
    </Section>
  );
}
