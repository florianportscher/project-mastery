import "server-only";
import { randomUUID } from "node:crypto";
import { beforeEach, vi } from "vitest";
import { fakeSupabase, type FakeRow } from "@/lib/supabase/testing";

/**
 * Test helpers for the Brief handler tests (`handler*.test.ts`), which are
 * split by behaviour. Importing this module mocks the signed-in user and the
 * Supabase server client with local tables, and resets both before each
 * test. Test files add `vi.mock("server-only", () => ({}))`.
 */

export const STUDENT = "11111111-1111-1111-1111-111111111111";
export const CLASSMATE = "22222222-2222-2222-2222-222222222222";
export const COURSE = "aaaaaaaa-c000-4000-8000-000000000001";
export const CLASSMATE_COURSE = "bbbbbbbb-c000-4000-8000-000000000001";
export const OLD_EXAM = "aaaaaaaa-0000-4000-8000-00000000e024";
export const LECTURE = "aaaaaaaa-0000-4000-8000-000000000001";

/** The exams the build found: the old exam Material, and one in Lecture 1. */
export const EXAM_2024 = "aaaaaaaa-0e40-4000-8000-00000000e024";
export const KLAUSUR_2023 = "aaaaaaaa-0e40-4000-8000-00000000e023";

/** A found exam of the Course, not yet asked about. */
export function exam(id: string, name: string, position: number): FakeRow {
  return {
    id,
    owner: STUDENT,
    course_id: COURSE,
    name,
    position,
    confirmed: null,
    asked: false,
  };
}

/** A top-level Topic, holding `TOPIC`. */
export const INTEGRALS = "aaaaaaaa-b000-4000-8000-000000000001";
export const TOPIC = "aaaaaaaa-7000-4000-8000-000000000001";

/** An admin chunk of Lecture 1, in Course order by `page`. */
export function adminChunk(page: number, markdown: string) {
  return {
    id: `aaaaaaaa-0c00-4000-8000-${String(page).padStart(12, "0")}`,
    owner: STUDENT,
    course_id: COURSE,
    material_id: LECTURE,
    label: "admin",
    page_from: page,
    position: page,
    markdown,
  };
}

let signedIn: string | null = STUDENT;
/** The local tables of the current test. */
export let db = createDb();

/** Signs in as another user, or signs out with `null`. */
export function signInAs(user: string | null) {
  signedIn = user;
}

function ownBrief(briefs: FakeRow[], courseId: unknown) {
  return briefs.find(
    (brief) => brief.course_id === courseId && brief.owner === signedIn,
  );
}

/** The local tables, with the ownership rules of the real policies. */
function createDb() {
  return fakeSupabase({
    tables: {
      courses: [
        { id: COURSE, owner: STUDENT, name: "Calculus" },
        { id: CLASSMATE_COURSE, owner: CLASSMATE, name: "Biology" },
      ] as FakeRow[],
      materials: [
        {
          id: OLD_EXAM,
          owner: STUDENT,
          course_id: COURSE,
          name: "Old exam 2024",
          created_at: "2026-10-01T00:00:00Z",
          parse_status: "parsed",
        },
        {
          id: LECTURE,
          owner: STUDENT,
          course_id: COURSE,
          name: "Lecture 1",
          created_at: "2026-10-02T00:00:00Z",
          parse_status: "parsed",
        },
      ] as FakeRow[],
      exams: [
        exam(EXAM_2024, "Old exam 2024", 0),
        exam(KLAUSUR_2023, "Klausur 2023", 1),
      ],
      briefs: [],
      mock_exams: [],
      brief_excluded_materials: [],
      brief_messages: [],
      ai_usage: [],
      // Substitution sits inside Integrals.
      topics: [
        {
          id: INTEGRALS,
          owner: STUDENT,
          course_id: COURSE,
          parent_id: null,
          name: "Integrals",
          position: 0,
        },
        {
          id: TOPIC,
          owner: STUDENT,
          course_id: COURSE,
          parent_id: INTEGRALS,
          name: "Substitution",
          position: 1,
        },
      ] as FakeRow[],
      exam_scopes: [],
      chunks: [],
    },
    primaryKeys: {
      briefs: ["course_id"],
      brief_excluded_materials: ["course_id", "material_id"],
    },
    // What the handler needs of the real functions; pgTAP tests those.
    functions: {
      save_brief: (args, tables) => {
        const brief = ownBrief(tables.briefs, args.course_id);
        if (!brief) return false;
        Object.assign(brief, args.fields);
        const exams = args.exam_ids as string[] | undefined;
        const asked = (args.asked_exam_ids ?? []) as string[];
        if (exams) {
          for (const exam of tables.exams) {
            if (exam.course_id !== args.course_id) continue;
            const id = exam.id as string;
            if (exams.includes(id)) exam.confirmed = true;
            else if (exam.confirmed === true || asked.includes(id)) {
              exam.confirmed = false;
            }
            if (asked.includes(id)) exam.asked = true;
          }
          if (
            brief.reserved_exam_id &&
            !exams.includes(brief.reserved_exam_id as string)
          ) {
            brief.reserved_exam_id = null;
            brief.reserved_exam_answered = false;
          }
        }
        if (args.course_language) {
          const course = tables.courses.find((c) => c.id === args.course_id);
          if (course) course.language = args.course_language;
        }
        const ids = args.excluded_material_ids as string[] | undefined;
        if (ids) {
          tables.brief_excluded_materials = tables.brief_excluded_materials
            .filter((row) => row.course_id !== args.course_id)
            .concat(
              [...new Set(ids)].map((id) => ({
                course_id: args.course_id,
                material_id: id,
                owner: signedIn,
              })),
            );
        }
        return true;
      },
      set_exam_scope: (args, tables) => {
        if (!ownBrief(tables.briefs, args.course_id)) return false;
        const { topic_id } = args;
        tables.exam_scopes = tables.exam_scopes.filter(
          (row) => row.topic_id !== topic_id,
        );
        if (args.scope !== undefined) {
          tables.exam_scopes.push({
            owner: signedIn,
            course_id: args.course_id,
            topic_id,
            scope: args.scope,
            words: args.words,
            created_at: new Date().toISOString(),
          });
        }
        return true;
      },
      add_brief_note: (args, tables) => {
        const brief = ownBrief(tables.briefs, args.course_id);
        if (!brief) return null;
        const notes = brief.notes
          ? `${brief.notes}\n\n${args.text}`
          : (args.text as string);
        if (notes.length > 20_000) return false;
        brief.notes = notes;
        return true;
      },
    },
    defaults: {
      briefs: () => ({
        owner: signedIn,
        exam_date: null,
        goal: null,
        open_book: null,
        formula_sheet: null,
        calculator: null,
        scope_confirmed: false,
        notes: null,
      }),
      brief_excluded_materials: () => ({ owner: signedIn }),
      brief_messages: () => ({ owner: signedIn, model_id: null }),
      ai_usage: () => ({
        owner: signedIn,
        estimated: false,
        chat_id: null,
        created_at: new Date().toISOString(),
      }),
    },
    canAccess: (table, row, tables) =>
      row.owner === signedIn &&
      (table === "briefs"
        ? tables.courses.some(
            (course) =>
              course.id === row.course_id && course.owner === signedIn,
          )
        : table !== "brief_messages" ||
          tables.briefs.some(
            (brief) =>
              brief.course_id === row.course_id && brief.owner === signedIn,
          )),
  });
}

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/auth/user", () => ({
  getUser: async () => (signedIn ? { id: signedIn, email: undefined } : null),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db }));

beforeEach(() => {
  signedIn = STUDENT;
  db = createDb();
  vi.stubEnv("AI_DAILY_LIMIT_USD", "");
});

export function userMessage(text: string, id: string = randomUUID()) {
  return { id, role: "user", parts: [{ type: "text", text }] };
}

/** Posts a request to the Brief handler, which `signal` can abort. */
export async function post(body: unknown, signal?: AbortSignal) {
  const { handleBriefRequest } = await import("./handler");
  return handleBriefRequest(
    new Request("http://localhost/api/brief", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
  );
}

/**
 * Posts a request to the Brief handler and reads the whole response: the
 * streamed text and error, or the refusal text.
 */
export async function send(body: unknown): Promise<{
  status: number;
  text?: string;
  error?: string;
  refusal?: string;
}> {
  const response = await post(body);
  const raw = await response.text();
  if (!response.ok) return { status: response.status, refusal: raw };
  const chunks = raw
    .split("\n")
    .filter((line) => line.startsWith("data: {"))
    .map((line) => JSON.parse(line.slice("data: ".length)));
  const text = chunks
    .filter((chunk) => chunk.type === "text-delta")
    .map((chunk) => chunk.delta)
    .join("");
  const error = chunks.find((chunk) => chunk.type === "error")?.errorText;
  return { status: response.status, text, ...(error && { error }) };
}

/** The stored messages of a Course's Brief as role and text, in order. */
export function stored(courseId = COURSE) {
  return db.tables.brief_messages
    .filter((message) => message.course_id === courseId)
    .map((message) => ({
      role: message.role,
      text: (message.parts as Array<{ text?: string }>)
        .map((part) => part.text ?? "")
        .join(""),
    }));
}
