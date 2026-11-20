import {
  ChapterRefs,
  ChunkRefs,
  Flag,
  Json,
  KcRefs,
  Ref,
  Row,
  Section,
  unitName,
} from "@/features/dev-inspector/components/inspector-parts";
import { unitCoverage } from "@/features/dev-inspector/domain/flags";
import { anchor, type Lookup } from "@/features/dev-inspector/domain/lookup";
import type { DevUnit, Flags, Snapshot } from "@/features/dev-inspector/types";
import { cn } from "@/lib/utils";

const percent = (share: number) => `${Math.round(share * 100)}%`;

/** Each teaching and exercise unit with its Chapters, coverage and KCs. */
export function UnitsSection({
  snapshot,
  units,
  lookup,
  flags,
}: {
  snapshot: Snapshot;
  units: DevUnit[];
  lookup: Lookup;
  flags: Flags;
}) {
  const cited = new Set(
    snapshot.kcs
      .filter((kc) => kc.retiredAt === null)
      .flatMap((kc) => kc.sources),
  );
  const current = new Set(units.map((unit) => unit.extraction?.id));
  const stale = snapshot.extractions.filter((e) => !current.has(e.id));
  return (
    <Section id="units" title="Units">
      <p className="text-xs text-muted-foreground">
        {units.filter((u) => u.kind === "content").length} teaching ·{" "}
        {units.filter((u) => u.kind === "exercise").length} exercise · formed
        from the current chunks
      </p>
      {units.map((unit) => {
        const below = flags.unitsBelowCoverage.get(unit.key);
        return (
          <div
            key={unit.key}
            id={anchor.unit(unit.key)}
            className="scroll-mt-4 space-y-0.5 rounded border p-2 target:border-yellow-500"
          >
            <div className="flex flex-wrap items-baseline gap-2 text-sm font-medium">
              {unitName(unit, lookup)}
              <span className="text-xs font-normal text-muted-foreground">
                {lookup.material.get(unit.materialId)?.name}
              </span>
              {below !== undefined && (
                <Flag>coverage {percent(below)}, below the bar</Flag>
              )}
              {!unit.extraction && <Flag>no extraction</Flag>}
            </div>
            <Row label="Chapters">
              <ChapterRefs ids={unit.chapterIds} lookup={lookup} />
            </Row>
            <Row label="Chunks">
              <ChunkRefs ids={unit.chunkIds} lookup={lookup} />
            </Row>
            {unit.kind === "content" && (
              <Row label="Coverage">
                {percent(unitCoverage(snapshot, unit, cited))}
              </Row>
            )}
            <Row label="KCs">
              <KcRefs ids={unit.extraction?.kcIds ?? []} lookup={lookup} />
            </Row>
            {unit.extraction && (
              <>
                <Row label="Extracted">
                  {new Date(unit.extraction.createdAt).toLocaleString("en")}
                  {unit.extraction.assumesMatched ? " · assumes matched" : ""}
                </Row>
                <Json
                  label="Stored extraction"
                  value={unit.extraction.output}
                />
              </>
            )}
          </div>
        );
      })}
      {stale.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {stale.length} stored extractions belong to no current unit.
        </p>
      )}
    </Section>
  );
}

/** Every KC with its sources, Prerequisites both ways, `assumes` and origin. */
export function KcsSection({
  snapshot,
  lookup,
  flags,
}: {
  snapshot: Snapshot;
  lookup: Lookup;
  flags: Flags;
}) {
  return (
    <Section id="kcs" title="KCs">
      <p className="text-xs text-muted-foreground">
        {snapshot.kcs.filter((kc) => kc.retiredAt === null).length} live ·{" "}
        {snapshot.kcs.filter((kc) => kc.retiredAt !== null).length} retired
      </p>
      {snapshot.kcs.map((kc) => {
        const twins = flags.nearDuplicates.get(kc.id) ?? [];
        const assumes = Array.isArray(kc.assumes)
          ? (kc.assumes as Array<{ name?: string; description?: string }>)
          : [];
        return (
          <div
            key={kc.id}
            id={anchor.kc(kc.id)}
            className={cn(
              "scroll-mt-4 space-y-0.5 rounded border p-2 target:border-yellow-500",
              kc.retiredAt && "opacity-50",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-medium">
                {kc.position}. {kc.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {kc.origin}
                {kc.retiredAt &&
                  ` · retired ${new Date(kc.retiredAt).toLocaleDateString("en")}`}
              </span>
              {flags.kcsWithoutSources.has(kc.id) && <Flag>no sources</Flag>}
              {twins.length > 0 && (
                <Flag>
                  near-duplicate of <KcRefs ids={twins} lookup={lookup} />
                </Flag>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{kc.description}</p>
            <Row label="Sources">
              <ChunkRefs ids={kc.sources} lookup={lookup} />
            </Row>
            <Row label="Unit">
              {(
                lookup.unitsOfKc.get(kc.id) ??
                  // Without a stored extraction naming it: its sources' units.
                  [
                    ...new Set(
                      kc.sources.flatMap(
                        (id) => lookup.unitsOfChunk.get(id) ?? [],
                      ),
                    ),
                  ]
              ).map((unit) => (
                <Ref key={unit.key} to={anchor.unit(unit.key)}>
                  {unitName(unit, lookup)}
                </Ref>
              ))}
            </Row>
            <Row label="Requires">
              <KcRefs ids={lookup.requires.get(kc.id) ?? []} lookup={lookup} />
            </Row>
            <Row label="Required by">
              <KcRefs
                ids={lookup.requiredBy.get(kc.id) ?? []}
                lookup={lookup}
              />
            </Row>
            {assumes.length > 0 && (
              <Row label="Assumes">
                {assumes.map((a) => a.name ?? "?").join("; ")}
              </Row>
            )}
            <Row label="Exercises">
              {(lookup.exercisesOfKc.get(kc.id) ?? []).map((id) => (
                <Ref key={id} to={anchor.exercise(id)} className="mr-2">
                  #{snapshot.exercises.find((e) => e.id === id)?.position}
                </Ref>
              ))}
            </Row>
            <Row label="Topic">
              {(lookup.topicsOfKc.get(kc.id) ?? []).map((id) => (
                <Ref key={id} to={anchor.topic(id)}>
                  {lookup.topic.get(id)?.name}
                </Ref>
              ))}
            </Row>
          </div>
        );
      })}
    </Section>
  );
}
