/**
 * The areas /garden works on, one at a time. This is the only definition: a
 * feature folder, or lib, components, hooks, app, supabase or tools.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export type Area = {
  name: string;
  /** Folders and files of the area, relative to the repo root. */
  paths: string[];
};

/** Generated code, tests and test helpers, left out of every number. */
export function isExcluded(file: string): boolean {
  return (
    /(\.test|\.spec|-testing)\.(tsx?|mjs)$/.test(file) ||
    file.startsWith("src/components/ui/") ||
    file.startsWith("src/components/ai-elements/") ||
    file.endsWith("database.types.ts") ||
    file.startsWith("supabase/tests/")
  );
}

export function listAreas(root: string): Area[] {
  const features = readdirSync(path.join(root, "src/features"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return [
    ...features.map((name) => ({ name, paths: [`src/features/${name}`] })),
    { name: "lib", paths: ["src/lib"] },
    { name: "components", paths: ["src/components"] },
    { name: "hooks", paths: ["src/hooks"] },
    {
      name: "app",
      paths: ["src/app", "src/proxy.ts", "src/instrumentation.ts"],
    },
    { name: "supabase", paths: ["supabase"] },
    { name: "tools", paths: ["tools", "e2e", "eslint"] },
  ];
}

/** The area a repo-relative file belongs to, if any. */
export function areaOf(areas: Area[], file: string): Area | undefined {
  return areas.find((area) =>
    area.paths.some((p) => file === p || file.startsWith(`${p}/`)),
  );
}

const CODE = /\.(ts|tsx|mts|mjs|sql)$/;

/** Repo-relative code files under a folder, or the file itself. */
export function listFiles(root: string, rel: string): string[] {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return CODE.test(rel) ? [rel] : [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) =>
    entry.name.startsWith(".") || entry.name === "node_modules"
      ? []
      : listFiles(root, `${rel}/${entry.name}`),
  );
}
