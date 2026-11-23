import Link from "next/link";
import { SendToDeveloper } from "@/features/dev-inspector/components/send-to-developer";
import {
  BuildSection,
  ExercisesSection,
  TopicsSection,
} from "@/features/dev-inspector/components/exercises-topics-build";
import {
  ChunksSection,
  MaterialsSection,
} from "@/features/dev-inspector/components/materials-outline";
import {
  KcsSection,
  UnitsSection,
} from "@/features/dev-inspector/components/units-kcs";
import { callFlags, callsByUnit } from "@/features/dev-inspector/domain/calls";
import { buildLookup } from "@/features/dev-inspector/domain/lookup";
import type {
  DevCalls,
  DevUnit,
  Flags,
  Snapshot,
} from "@/features/dev-inspector/types";

const SECTIONS = [
  ["materials", "Materials"],
  ["chunks", "Chunks"],
  ["units", "Units"],
  ["kcs", "KCs"],
  ["exercises", "Exercises"],
  ["topics", "Topics"],
  ["build", "Build"],
] as const;

/**
 * The developer view of a Course's map build: what the parse and build
 * stored, every part linked to the others, suspect spots flagged.
 */
export function CourseInspector({
  snapshot,
  units,
  flags,
  calls,
  buildSent,
  backHref,
}: {
  snapshot: Snapshot;
  units: DevUnit[];
  flags: Flags;
  calls: DevCalls;
  /** Whether this build was sent to the developer; null without a build. */
  buildSent: boolean | null;
  backHref: string;
}) {
  const lookup = buildLookup(snapshot, units);
  const traced = calls.status === "ok" ? calls.calls : [];
  const marks = callFlags(traced);
  const counts = [
    `${flags.chunksWithoutKcs.size} content chunks without KCs`,
    `${flags.kcsWithoutSources.size} KCs without sources`,
    `${flags.nearDuplicates.size} near-duplicate KCs`,
    `${flags.unitsBelowCoverage.size} units below coverage`,
    `${flags.unreadPages.size} unread pages`,
    `${marks.failed.size} failed calls`,
    `${marks.retried.size} retried calls`,
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <header className="space-y-2">
        <Link href={backHref} className="text-xs text-muted-foreground">
          ← Course map
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">
            {snapshot.course.name}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              developer view
            </span>
          </h1>
          {buildSent !== null && (
            <SendToDeveloper
              // A new build is a new flag target.
              key={`${snapshot.build?.appCommit}-${snapshot.build?.finishedAt}`}
              courseId={snapshot.course.id}
              sent={buildSent}
            />
          )}
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-blue-700 hover:underline dark:text-blue-300"
            >
              {label}
            </a>
          ))}
        </nav>
        <p className="text-xs text-red-800 dark:text-red-200">
          ⚑ {counts.join(" · ")}
        </p>
      </header>
      <MaterialsSection snapshot={snapshot} flags={flags} />
      <ChunksSection snapshot={snapshot} lookup={lookup} flags={flags} />
      <UnitsSection
        snapshot={snapshot}
        units={units}
        lookup={lookup}
        flags={flags}
        unitCalls={calls.status === "ok" ? callsByUnit(traced) : null}
        callFlags={marks}
      />
      <KcsSection snapshot={snapshot} lookup={lookup} flags={flags} />
      <ExercisesSection snapshot={snapshot} lookup={lookup} />
      <TopicsSection snapshot={snapshot} lookup={lookup} />
      <BuildSection
        snapshot={snapshot}
        calls={calls}
        callFlags={marks}
        lookup={lookup}
      />
    </div>
  );
}
