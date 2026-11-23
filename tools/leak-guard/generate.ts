import { mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { ALLOWLIST_FILE, readAllowlist } from "./allowlist";
import { fingerprints, fingerprintsFile } from "./quotes";

type Listed = Map<string, number>;

/** `name:size` of every allowlisted file that exists, to tell AI-written Materials from real ones. */
function listedFiles(): Listed {
  const root = path.resolve(path.dirname(ALLOWLIST_FILE), "../..");
  const listed: Listed = new Map();
  for (const entry of readAllowlist().entries) {
    const file = entry.slice(0, entry.lastIndexOf(" "));
    try {
      listed.set(
        `${path.basename(file)}:${statSync(path.join(root, file)).size}`,
        1,
      );
    } catch {
      // A listed file that is not checked out cannot match a Material.
    }
  }
  return listed;
}

/**
 * Reads every staging chunk (read-only), skips the Courses whose Materials are
 * all allowlisted (by name and size; the database holds no file hash), and
 * writes the sorted fingerprints of the rest to the private cases repo.
 */
export async function writeFingerprints(env = process.env) {
  const listed = listedFiles();
  const url = env.STAGING_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing STAGING_DATABASE_URL in .env.local (the read-only staging role, ADR 0025).",
    );
  }
  const sql = postgres(url, {
    max: 1,
    connect_timeout: 15,
    onnotice: () => {},
  });
  try {
    return await sql.begin(async (tx) => {
      await tx`SET TRANSACTION READ ONLY`;
      await tx`SET LOCAL statement_timeout = '120s'`;
      const materials = await tx<
        { course_id: string; name: string; size_bytes: string }[]
      >`select course_id, name, size_bytes from public.materials`;
      const real = new Set<string>();
      for (const m of materials) {
        if (!listed.has(`${m.name}:${m.size_bytes}`)) real.add(m.course_id);
      }
      const all = new Set<string>();
      for (const courseId of real) {
        const chunks = await tx<{ markdown: string }[]>`
          select markdown from public.chunks where course_id = ${courseId}`;
        for (const chunk of chunks) {
          for (const print of fingerprints(chunk.markdown)) all.add(print);
        }
      }
      const file = fingerprintsFile(env);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, `${[...all].sort().join("\n")}\n`);
      return { courses: real.size, lines: all.size, file };
    });
  } finally {
    await sql.end();
  }
}
