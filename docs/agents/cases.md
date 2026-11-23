# Cases

A case keeps one map build or Chat from staging with everything needed to understand it and to replay its model calls later ([ADR 0034](../adr/0034-case-archive.md)). Cases live in the private repo `project-mastery-cases`, never in this one: they hold real course Materials.

## Commands

- `pnpm archive course <courseId> [--note "…"]`: archives the Course's current map build on staging, commits it to the cases repo's `main` and pushes. It prints the case id and the bundle's files with their sizes.
- `pnpm archive chat <chatId> [--note "…"]`: the same for a Chat on staging. `run.json.gz` is `{ chat, messages, snapshot }`: the Chat row, its messages with each reply's `tutor_context`, and its Course's build snapshot. `calls.jsonl.gz` holds every call of the Chat's Langfuse session (`sessionId` = the Chat id). The manifest has `chat: { id, messages, mapRebuiltAfterFirstMessage }`; `true` means the Course's map was rebuilt after the Chat's first message, so the snapshot is not the map the Chat saw. The Course's Materials are copied as for a map case.
- `pnpm -s agent staging-reset-map <courseId>` archives the build the same way first, with the note `before staging-reset-map`, and deletes nothing when the archive fails.

The archive reads staging (`.env.local`'s `STAGING_*` variables) and Langfuse (`LANGFUSE_*`), and makes no model calls. It refuses to write unless the cases repo's `origin` is private (`gh repo view`) and both folders below lie outside this repo.

## Folders

- `MASTERY_CASES_DIR`, default `~/project-mastery-cases`: a clone of the private cases repo. Each case is `cases/<case id>/`.
- `MASTERY_MATERIALS_DIR`, default `~/mastery-materials`: each Material's file as `<sha256>.<ext>`, copied from staging storage once. It is in neither repo.

## Bundle

The case id is `<date>-<map|chat>-<n>`: the UTC day of the archive and a count per day and kind.

- `manifest.json`: `caseId`, `kind`, `note`, `archivedAt`, the Course's id and name, `shape.materials` (each Material's id, sha256, media type as `kind`, pages, language), `run` (status, UTC start and end, the build's app commit), the distinct `appCommits` and `models` of the calls, their `cost` in dollars, `calls` (`archived`, and `missing`: units the build extracted whose call Langfuse no longer has, such as after its 30 days) and `observations`, an empty list for the observation issues that cite the case.
- `run.json.gz`: `{ snapshot, chunks }`, the `course_build_snapshot` that `agent inspect` reads (the check report is its `build.checkReport`) and every chunk's id and Markdown.
- `calls.jsonl.gz`: one model call per line, oldest first: the parse calls of the Course's Materials and the calls of its current build, from its start to its end. Each has `id`, `traceName`, `model`, `startTime`, `endTime`, `level`, `statusMessage`, `metadata` (with `appCommit`), `usage`, `cost`, `input` and `output`. A page image in an input is `{ type, material: <sha256>, page }`.

Read one with `gunzip -c calls.jsonl.gz | head -1`.

## Citing a case

An observation issue names the case id and the call ids that show the problem in its **Seen on** line ([issue-tracker.md](issue-tracker.md)), for example `slides, finance; case 2026-11-23-map-1, calls 7725afb9…, 77ee2161…`.
