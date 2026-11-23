import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { browser, settle, snapshot } from "./browser";
import { AgentError, ROOT, supabaseEnv } from "./config";
import { PERSONAS } from "./personas";
import { runSql } from "./supabase";
import { normalizeSnapshot } from "./walk-diff";

type Seed = {
  courseId: string;
  chatId: string;
  topicId: string;
  materialId: string;
  mockId: string;
};

const BUCKET = "course-files";
const PDF = path.join(ROOT, "e2e/files/lecture-notes.pdf");

async function userId(email: string) {
  const rows = (await runSql(
    `select id from auth.users where email = '${email}'`,
  )) as { id: string }[];
  if (!rows[0]) throw new AgentError(`No user ${email}: run \`agent up\`.`);
  return rows[0].id;
}

async function uploadFile(storagePath: string) {
  const { url, secretKey } = supabaseEnv();
  const response = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/pdf",
      },
      body: readFileSync(PDF),
    },
  );
  if (!response.ok)
    throw new AgentError(`Seeding a file failed: ${await response.text()}`);
}

/**
 * Replaces everything the two test users own with one fixed Course each: a
 * Chat with a message, a Material with its file, a one-KC Knowledge map and a
 * ready Mock exam, as the e2e fixtures store them.
 */
async function seed(owner: string, courseName: string): Promise<Seed> {
  const ids = {
    courseId: randomUUID(),
    chatId: randomUUID(),
    topicId: randomUUID(),
    materialId: randomUUID(),
    mockId: randomUUID(),
  };
  const kcId = randomUUID();
  const chunkId = randomUUID();
  const storagePath = `${owner}/${ids.courseId}/${ids.materialId}`;
  await uploadFile(storagePath);
  const at = "2026-01-05T09:00:00Z";
  const own = `owner, course_id`;
  const vals = `'${owner}', '${ids.courseId}'`;
  await runSql(`
    insert into courses (id, owner, name) values ('${ids.courseId}', '${owner}', '${courseName}');
    insert into chats (id, owner, course_id, title, created_at, last_message_at)
      values ('${ids.chatId}', '${owner}', '${ids.courseId}', null, '${at}', '${at}');
    insert into chat_messages (chat_id, role, parts, created_at)
      values ('${ids.chatId}', 'user', '[{"type":"text","text":"What makes a rocket accelerate?"}]', '${at}');
    insert into materials (id, owner, course_id, name, media_type, size_bytes, storage_path, parse_status)
      values ('${ids.materialId}', '${owner}', '${ids.courseId}', 'Lecture notes', 'application/pdf', 1000, '${storagePath}', 'parsed');
    insert into kcs (id, ${own}, name, description, origin, position)
      values ('${kcId}', ${vals}, 'Thrust equation', 'Thrust is mass flow times the change in velocity.', 'content', 0);
    insert into topics (id, ${own}, name, central_question, position)
      values ('${ids.topicId}', ${vals}, 'Thrust basics', 'What makes a rocket accelerate?', 0);
    insert into topic_kcs (topic_id, kc_id, owner, position) values ('${ids.topicId}', '${kcId}', '${owner}', 0);
    insert into chunks (id, ${own}, material_id, position, page_from, page_to, label, markdown)
      values ('${chunkId}', ${vals}, '${ids.materialId}', 0, 1, 1, 'content', 'Thrust is mass flow times the change in velocity.');
    insert into kc_sources (${own}, kc_id, chunk_id) values (${vals}, '${kcId}', '${chunkId}');
    insert into mock_exams (id, owner, course_id, status, duration_minutes, predicted_score)
      values ('${ids.mockId}', '${owner}', '${ids.courseId}', 'ready', 18, 9);
    insert into mock_items (mock_id, owner, position, exercise_id, prompt, points, predicted_success)
      values ('${ids.mockId}', '${owner}', 0, null, 'Name the stages of a turbojet.', 6, 0.5);
  `);
  return ids;
}

/** Deletes the two test users' Courses (everything under them goes along) and files. */
async function clearData(owners: string[]) {
  const list = owners.map((id) => `'${id}'`).join(", ");
  const files = (await runSql(
    `select name from storage.objects where bucket_id = '${BUCKET}' and (storage.foldername(name))[1] in (${list})`,
  )) as { name: string }[];
  await runSql(`delete from courses where owner in (${list})`);
  if (files.length === 0) return;
  const { url, secretKey } = supabaseEnv();
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: files.map((file) => file.name) }),
  });
  if (!response.ok)
    throw new AgentError(`Removing files failed: ${await response.text()}`);
}

type Visit = { name: string; path: string };

const studentVisits = (s: Seed): Visit[] => [
  { name: "home", path: "/" },
  { name: "courses", path: "/courses" },
  { name: "course", path: `/courses/${s.courseId}` },
  { name: "brief", path: `/courses/${s.courseId}/brief` },
  { name: "chat-new", path: `/courses/${s.courseId}/chat` },
  { name: "chat", path: `/courses/${s.courseId}/chat/${s.chatId}` },
  { name: "map", path: `/courses/${s.courseId}/map` },
  { name: "topic", path: `/courses/${s.courseId}/map/${s.topicId}` },
  { name: "materials", path: `/courses/${s.courseId}/materials` },
  {
    name: "material",
    path: `/courses/${s.courseId}/materials/${s.materialId}`,
  },
  { name: "mock-exam", path: `/courses/${s.courseId}/mock/${s.mockId}` },
  { name: "dev-course", path: `/dev/courses/${s.courseId}` },
  { name: "login", path: "/login" },
  { name: "auth-error", path: "/auth/error" },
];

/** The classmate's own pages, and the Student's Course, which they must not see. */
const classmateVisits = (own: Seed, student: Seed): Visit[] => [
  { name: "courses", path: "/courses" },
  { name: "course", path: `/courses/${own.courseId}` },
  { name: "map", path: `/courses/${own.courseId}/map` },
  { name: "student-course", path: `/courses/${student.courseId}` },
  { name: "student-map", path: `/courses/${student.courseId}/map` },
  {
    name: "student-chat",
    path: `/courses/${student.courseId}/chat/${student.chatId}`,
  },
];

/**
 * Records every page as `student`, and the main pages as `classmate`, one
 * normalized text snapshot each, in `<dir>/<persona>/<page>.txt`. Seeds its
 * own data first; the dev server must run on the mock AI.
 */
export async function walk(
  dir: string,
  port: number,
  login: (persona: string) => Promise<string>,
) {
  const owners = {
    student: await userId(PERSONAS.student.email),
    classmate: await userId(PERSONAS.classmate.email),
  };
  await clearData(Object.values(owners));
  const seeds = {
    student: await seed(owners.student, "Calculus"),
    classmate: await seed(owners.classmate, "Classmate Course"),
  };
  rmSync(dir, { recursive: true, force: true });
  const plan = {
    student: studentVisits(seeds.student),
    classmate: classmateVisits(seeds.classmate, seeds.student),
  };
  let pages = 0;
  for (const [who, visits] of Object.entries(plan)) {
    await login(who);
    mkdirSync(path.join(dir, who), { recursive: true });
    for (const visit of visits) {
      await browser(["open", `http://localhost:${port}${visit.path}`]);
      await settle();
      writeFileSync(
        path.join(dir, who, `${visit.name}.txt`),
        `${normalizeSnapshot(await snapshot())}\n`,
      );
      pages++;
    }
  }
  return `walked ${pages} pages into ${path.relative(ROOT, dir) || dir}`;
}
