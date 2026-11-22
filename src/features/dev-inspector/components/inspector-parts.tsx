import type { ReactNode } from "react";
import { anchor, type Lookup } from "@/features/dev-inspector/domain/lookup";
import { cn } from "@/lib/utils";

/** One section of the developer page, with its anchor. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4 space-y-2">
      <h2 className="border-b pb-1 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** A suspect spot, in red. */
export function Flag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-red-100 px-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
      ⚑ {children}
    </span>
  );
}

/** A link to another part of the page. */
export function Ref({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={`#${to}`}
      className={cn(
        "text-blue-700 hover:underline dark:text-blue-300",
        className,
      )}
    >
      {children}
    </a>
  );
}

/** Links to KCs by name, retired ones struck through. */
export function KcRefs({ ids, lookup }: { ids: string[]; lookup: Lookup }) {
  if (ids.length === 0) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-2">
      {ids.map((id) => {
        const kc = lookup.kc.get(id);
        return (
          <Ref
            key={id}
            to={anchor.kc(id)}
            className={cn(kc?.retiredAt && "line-through opacity-60")}
          >
            {kc?.name ?? id}
          </Ref>
        );
      })}
    </span>
  );
}

/** Links to chunks by label and pages. */
export function ChunkRefs({ ids, lookup }: { ids: string[]; lookup: Lookup }) {
  if (ids.length === 0) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-2">
      {ids.map((id) => (
        <Ref key={id} to={anchor.chunk(id)}>
          {chunkName(id, lookup)}
        </Ref>
      ))}
    </span>
  );
}

/** A chunk as "label p. 3–4 (1,200 ch.)". */
export function chunkName(id: string, lookup: Lookup): string {
  const chunk = lookup.chunk.get(id);
  if (!chunk) return id;
  const pages =
    chunk.pageFrom === chunk.pageTo
      ? `p. ${chunk.pageFrom}`
      : `p. ${chunk.pageFrom}–${chunk.pageTo}`;
  return `${chunk.label} ${pages}`;
}

/** A unit's name: where it is, its kind and batch. */
export function unitName(unit: {
  title: string;
  kind: string;
  batch: number;
}): string {
  return `${unit.title} · ${unit.kind} ${unit.batch}`;
}

/** A key–value row of a detail list. */
export function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/** Raw JSON, collapsed. */
export function Json({
  label,
  value,
  open,
}: {
  label: string;
  value: unknown;
  open?: boolean;
}) {
  return (
    <details className="text-xs" open={open}>
      <summary className="cursor-pointer text-muted-foreground">
        {label}
      </summary>
      <pre className="max-h-96 overflow-auto rounded bg-muted p-2 whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
