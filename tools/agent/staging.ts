import postgres from "postgres";
import { AgentError } from "./config";

/**
 * The staging project's rows for agents to review and, for testing, to change
 * (ADR 0025, ADR 0029). These commands do not work against the local stack.
 * Reads send GET requests only; writes go through `writeStaging` alone. Never
 * production: the URL and key come from the STAGING_ variables.
 */

const envNames = ["STAGING_SUPABASE_URL", "STAGING_SUPABASE_SECRET_KEY"];

type Env = Record<string, string | undefined>;

/** The default row count, so a query without `limit` cannot flood an agent's context. */
export const DEFAULT_LIMIT = 20;
/** The largest row count one call may ask for. */
export const MAX_LIMIT = 200;

/**
 * A table or view name, optionally with a PostgREST query string. Anything
 * else is refused: a slash would reach `rpc/...` (functions can write) or a
 * single row, and only GET requests are sent.
 */
const TABLE_PATH = /^[a-z_][a-z0-9_]*(\?\S*)?$/;

/** The staging project from `.env.local`. Refuses to run without both variables. */
export function stagingEnv(env: Env = process.env) {
  const url = env.STAGING_SUPABASE_URL;
  const secretKey = env.STAGING_SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    const missing = envNames.filter((name) => !env[name]);
    throw new AgentError(
      `Missing ${missing.join(" and ")} in .env.local. Set them from the staging project's API keys (Project URL and secret key).`,
    );
  }
  if (!/^https:\/\//.test(url)) {
    throw new AgentError("STAGING_SUPABASE_URL must start with https://.");
  }
  return { url: url.replace(/\/+$/, ""), secretKey };
}

/**
 * The GET URL for one table query, with the default `limit`. Throws on a path
 * that is not a plain table name, or on a `limit` outside 1..MAX_LIMIT.
 */
export function stagingRequestUrl(baseUrl: string, input: string): URL {
  const trimmed = input.trim();
  if (!TABLE_PATH.test(trimmed)) {
    throw new AgentError(
      `"${input}" is not a table query. Give a table name with optional PostgREST parameters, for example: agent staging "materials?select=id,title&limit=5"`,
    );
  }
  const url = new URL(`${baseUrl}/rest/v1/${trimmed}`);
  if (!url.searchParams.has("limit")) {
    url.searchParams.set("limit", String(DEFAULT_LIMIT));
  }
  const limit = url.searchParams.get("limit") ?? "";
  if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > MAX_LIMIT) {
    throw new AgentError(
      `limit must be a whole number from 1 to ${MAX_LIMIT}, got "${limit}".`,
    );
  }
  return url;
}

/**
 * Runs one read against the staging REST API and returns the rows as one line
 * of JSON.
 */
export async function queryStaging(
  input: string,
  env: Env = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const { url, secretKey } = stagingEnv(env);
  const response = await fetchFn(stagingRequestUrl(url, input), {
    method: "GET",
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new AgentError(
      `Staging returned ${response.status}: ${body.slice(0, 500)}`,
    );
  }
  return JSON.stringify(JSON.parse(body));
}

const WRITE_METHODS = ["POST", "PATCH", "DELETE"] as const;
type WriteMethod = (typeof WRITE_METHODS)[number];

/**
 * The URL, method and body of one staging write, or a refusal. Tables only
 * (no `rpc/`), and PATCH and DELETE need a filter so one call cannot rewrite
 * or empty a whole table by accident.
 */
export function stagingWriteRequest(
  baseUrl: string,
  input: string,
  body: string | undefined,
): { url: URL; method: WriteMethod; body?: string } {
  const [rawMethod, target, ...rest] = input.trim().split(/\s+/);
  const method = rawMethod?.toUpperCase() as WriteMethod;
  if (!WRITE_METHODS.includes(method) || !target || rest.length > 0) {
    throw new AgentError(
      `Give "<POST|PATCH|DELETE> <table>?<params>", for example: agent staging-write "PATCH materials?id=eq.7" '{"title":"x"}'`,
    );
  }
  if (!TABLE_PATH.test(target)) {
    throw new AgentError(
      `"${target}" is not a table query. rpc/ functions and single-row paths are refused.`,
    );
  }
  const url = new URL(`${baseUrl}/rest/v1/${target}`);
  const filters = [...url.searchParams.keys()].filter(
    (key) => !["on_conflict", "columns", "select"].includes(key),
  );
  if (method !== "POST" && filters.length === 0) {
    throw new AgentError(
      `${method} needs a filter, for example ?id=eq.7, so it cannot touch every row.`,
    );
  }
  if (method === "DELETE") return { url, method };
  if (!body) {
    throw new AgentError(`${method} needs a JSON body as the second argument.`);
  }
  try {
    JSON.parse(body);
  } catch {
    throw new AgentError("The body is not valid JSON.");
  }
  return { url, method, body };
}

/**
 * Runs one write against the staging REST API with the secret key and returns
 * the affected rows as one line of JSON. `POST` with `on_conflict` upserts.
 */
export async function writeStaging(
  input: string,
  body: string | undefined,
  env: Env = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const { url, secretKey } = stagingEnv(env);
  const request = stagingWriteRequest(url, input, body);
  const upsert = request.url.searchParams.has("on_conflict");
  const response = await fetchFn(request.url, {
    method: request.method,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: `return=representation${upsert ? ",resolution=merge-duplicates" : ""}`,
    },
    body: request.body,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new AgentError(
      `Staging returned ${response.status}: ${text.slice(0, 500)}`,
    );
  }
  return text ? JSON.stringify(JSON.parse(text)) : "[]";
}

/** The most rows one SQL call prints. */
const SQL_ROW_LIMIT = 200;

/** Statements that only read. Anything else is refused before it reaches the database. */
const READ_STATEMENT = /^\s*(select|with|table|values|show|explain)\b/i;

/**
 * One read-only statement, or a refusal. A second statement after a `;` could
 * end the read-only transaction, so it is refused too.
 */
export function checkReadQuery(query: string): string {
  const trimmed = query.trim().replace(/;\s*$/, "");
  if (!READ_STATEMENT.test(trimmed)) {
    throw new AgentError(
      "staging-sql runs reads only: the query must start with select, with, table, values, show or explain.",
    );
  }
  if (trimmed.includes(";")) {
    throw new AgentError("staging-sql runs one statement at a time.");
  }
  return trimmed;
}

/**
 * The staging database's connection string from `.env.local`: a Postgres
 * role that can only read (ADR 0025). The role is the real guard; the read-only
 * transaction below is a second layer.
 */
export function stagingDatabaseUrl(env: Env = process.env): string {
  const url = env.STAGING_DATABASE_URL;
  if (!url) {
    throw new AgentError(
      "Missing STAGING_DATABASE_URL in .env.local. Set it to the connection string of the read-only staging role (ADR 0025).",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new AgentError("STAGING_DATABASE_URL must start with postgresql://.");
  }
  return url;
}

/**
 * Runs one read-only query against the staging database. Prints at most
 * SQL_ROW_LIMIT rows, as one JSON line each, and says how many were left out.
 */
export async function queryStagingSql(
  query: string,
  env: Env = process.env,
): Promise<string> {
  const statement = checkReadQuery(query);
  const sql = postgres(stagingDatabaseUrl(env), {
    max: 1,
    connect_timeout: 15,
    onnotice: () => {},
  });
  try {
    const rows = await sql.begin(async (tx) => {
      await tx`SET TRANSACTION READ ONLY`;
      await tx`SET LOCAL statement_timeout = '15s'`;
      return tx.unsafe(statement);
    });
    const shown = rows
      .slice(0, SQL_ROW_LIMIT)
      .map((row) => JSON.stringify(row));
    if (rows.length > SQL_ROW_LIMIT) {
      shown.push(
        `(${rows.length} rows, showing ${SQL_ROW_LIMIT}; add a LIMIT to the query)`,
      );
    }
    return shown.join("\n") || "(no rows)";
  } catch (error) {
    if (error instanceof postgres.PostgresError) {
      throw new AgentError(`Staging database: ${error.message}`);
    }
    throw error;
  } finally {
    await sql.end();
  }
}

/**
 * The tables one map build fills, in the order they are emptied. Their rows
 * take the rows that hang off them: Topics take `topic_kcs`, notes and choices;
 * Exercises take `exercise_kcs` and `exercise_chunks`; KCs take `kc_sources`,
 * `prerequisite_links`, `attempts`, `question_kcs`, `problem_kcs` and
 * `kc_priorities`. Materials, `material_pages` and `chunks` (the parse) stay.
 */
const MAP_BUILD_TABLES = [
  "topics",
  "exercises",
  "exams",
  "unit_extractions",
  "kcs",
  "knowledge_map_builds",
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deletes a Course's whole map build on staging and keeps its Materials and
 * their parse, so the next Build starts from the chunks. Uses `writeStaging`,
 * so it is bound by ADR 0029: one filtered DELETE per table, no undo. Refuses
 * an unknown Course and a build that is running. `archive` keeps the build as
 * a case first (`agent archive`); when it throws, nothing is deleted.
 */
export async function resetStagingMap(
  courseId: string,
  archive: () => Promise<string>,
  env: Env = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  if (!UUID.test(courseId)) {
    throw new AgentError(`"${courseId}" is not a Course id (a UUID).`);
  }
  const course = JSON.parse(
    await queryStaging(`courses?id=eq.${courseId}&select=id`, env, fetchFn),
  ) as unknown[];
  if (course.length === 0) {
    throw new AgentError(`No Course ${courseId} on staging.`);
  }
  const build = async () => {
    const rows = JSON.parse(
      await queryStaging(
        `knowledge_map_builds?course_id=eq.${courseId}&select=status,started_at`,
        env,
        fetchFn,
      ),
    ) as { status: string; started_at: string }[];
    return rows[0] ?? null;
  };
  const before = await build();
  if (before?.status === "building") {
    throw new AgentError(
      "This Course's build is running. Wait for it to end, then reset.",
    );
  }
  let hasRows = false;
  for (const table of MAP_BUILD_TABLES) {
    const rows = JSON.parse(
      await queryStaging(
        `${table}?course_id=eq.${courseId}&select=course_id&limit=1`,
        env,
        fetchFn,
      ),
    ) as unknown[];
    hasRows ||= rows.length > 0;
  }
  const lines: string[] = [];
  if (hasRows) {
    lines.push(await archive());
    // The archive takes minutes: a build that started meanwhile is not the archived one.
    const after = await build();
    if (
      after?.status === "building" ||
      after?.started_at !== before?.started_at
    ) {
      throw new AgentError(
        "The Course's build changed while it was archived. Nothing was deleted; archive and reset again.",
      );
    }
  } else lines.push("no map to archive");
  for (const table of MAP_BUILD_TABLES) {
    // `course_id` is the one column every table here has (the builds table has no `id`).
    const rows = JSON.parse(
      await writeStaging(
        `DELETE ${table}?course_id=eq.${courseId}&select=course_id`,
        undefined,
        env,
        fetchFn,
      ),
    ) as unknown[];
    lines.push(`${table.padEnd(22)}${rows.length} deleted`);
  }
  lines.push(
    "Materials and chunks kept. Deleted with the KCs: Students' attempts, Priorities and Topic choices and notes for this Course.",
  );
  return lines.join("\n");
}
