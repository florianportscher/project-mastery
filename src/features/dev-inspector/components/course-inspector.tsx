import Link from "next/link";
import {
  BuildSection,
  ExercisesSection,
  TopicsSection,
} from "@/features/dev-inspector/components/exercises-topics-build";
import {
  MaterialsSection,
  OutlineSection,
} from "@/features/dev-inspector/components/materials-outline";
import {
  KcsSection,
  UnitsSection,
} from "@/features/dev-inspector/components/units-kcs";
import { buildLookup } from "@/features/dev-inspector/domain/lookup";
import type { DevUnit, Flags, Snapshot } from "@/features/dev-inspector/types";

const SECTIONS = [
  ["materials", "Materials"],
  ["outline", "Outline"],
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
  backHref,
}: {
  snapshot: Snapshot;
  units: DevUnit[];
  flags: Flags;
  backHref: string;
}) {
  const lookup = buildLookup(snapshot, units);
  const counts = [
    `${flags.chaptersWithoutKcs.size} Chapters without KCs`,
    `${flags.kcsWithoutSources.size} KCs without sources`,
    `${flags.nearDuplicates.size} near-duplicate KCs`,
    `${flags.unitsBelowCoverage.size} units below coverage`,
    `${flags.unreadPages.size} unread pages`,
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <header className="space-y-2">
        <Link href={backHref} className="text-xs text-muted-foreground">
          ← Course map
        </Link>
        <h1 className="text-xl font-semibold">
          {snapshot.course.name}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            developer view
          </span>
        </h1>
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
      <OutlineSection snapshot={snapshot} lookup={lookup} flags={flags} />
      <UnitsSection
        snapshot={snapshot}
        units={units}
        lookup={lookup}
        flags={flags}
      />
      <KcsSection snapshot={snapshot} lookup={lookup} flags={flags} />
      <ExercisesSection snapshot={snapshot} lookup={lookup} />
      <TopicsSection snapshot={snapshot} lookup={lookup} />
      <BuildSection snapshot={snapshot} />
    </div>
  );
}
