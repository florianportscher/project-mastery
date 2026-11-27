# Cases

A case keeps one map build or Chat from staging with everything needed to understand it and to replay its model calls later ([ADR 0035](../adr/0035-case-archive.md)). Cases live in the private repo `project-mastery-cases`, never in this one: they hold real course Materials.

## Commands

- `pnpm archive course <courseId> [--note "…"]`: archives the Course's current map build on staging, commits it to the cases repo's `main` and pushes. It prints the case id and the bundle's files with their sizes.
- `pnpm archive chat <chatId> [--note "…"]`: the same for a Chat on staging. `run.json.gz` is `{ chat, messages, snapshot }`: the Chat row, its messages with each reply's `tutor_context`, and its Course's build snapshot. `calls.jsonl.gz` holds every call of the Chat's Langfuse session (`sessionId` = the Chat id). The manifest has `chat: { id, mapRebuiltAfterFirstMessage }`; `true` means the Course's map was rebuilt after the Chat's first message, so the snapshot is not the map the Chat saw. The Course's Materials are copied as for a map case.
- `pnpm archive flagged`: archives each `developer_flags` row without a `case_id` (a Chat or map build sent from the app with **Send to developer**), with its note, and sets the row's `case_id` through `staging-write`. A map flag is skipped, with the case id it would have been, when the Course was rebuilt since it was sent. A flag whose Course is deleted is reported as lost and stays unmarked. If the case is pushed but the flag cannot be marked, the line names the case id: set it by hand.
- `pnpm -s agent staging-reset-map <courseId>` archives the build the same way first, with the note `before staging-reset-map`, when the Course has any map rows, and deletes nothing when the archive fails or a build started meanwhile.

`archive flagged` also writes `case_id` to staging.

The archive reads staging (`.env.local`'s `STAGING_*` variables) and Langfuse (`LANGFUSE_*`), and makes no model calls. It refuses to write unless the cases repo's `origin` is private (`gh repo view`) and both folders below lie outside this repo.

## Folders

- `MASTERY_CASES_DIR`, default `~/project-mastery-cases`: a clone of the private cases repo. Each case is `cases/<case id>/`.
- `MASTERY_MATERIALS_DIR`, default `~/mastery-materials`: each Material's file as `<sha256>.<ext>`, copied from staging storage once. It is in neither repo.

## Bundle

The case id is `<date>-<map|chat>-<n>`: the UTC day of the archive and a count per day and kind.

- `manifest.json`: `caseId`, `kind`, `note`, `archivedAt`, the Course's id and name, `shape.materials` (each Material's id, sha256, media type as `kind`, pages, language), `run` (UTC start and end of the build; a Chat's case runs from its first to its last message, null without messages), the distinct `appCommits` and `models` of the calls (each call's requested model id, as `pnpm replay --model` accepts, else its `model`), their `cost` in dollars, `calls` (`archived`, and `missing`: units the build extracted whose call Langfuse no longer has, such as after its 30 days) and `observations`, an empty list for the observation issues that cite the case.
- `run.json.gz`: `{ snapshot, chunks }`, the `course_build_snapshot` that `agent inspect` reads (the check report is its `build.checkReport`) and every chunk's id and Markdown.
- `calls.jsonl.gz`: one model call per line, oldest first: the parse calls of the Course's Materials and the calls of its current build, from its start to its end (to the archive while it runs), outside any Chat session. Each has `id`, `traceName`, `model`, `startTime`, `endTime`, `level`, `statusMessage`, `metadata` (with `appCommit`), `usage`, `cost`, `input` and `output`. A page image in an input is `{ type, material: <sha256>, page }`.

Read one with `gunzip -c calls.jsonl.gz | head -1`.

## Reading a case

`pnpm -s case list` lists the cases with their note and the observations they cite. `pnpm -s case show <caseId>` prints a Chat's transcript, each reply with its time (UTC), its Questions in full and the ids of the model calls that made it, or a map build as `agent inspect` prints it (`show <caseId> <section>` for one section, `calls` for the call list). `pnpm -s case call <caseId> <callId>` prints one call's messages and answer, the system prompt by length only. `/analyze` turns cases into observations.

## Citing a case

An observation issue names the case id and the call ids that show the problem in its **Seen on** line ([issue-tracker.md](issue-tracker.md)), for example `slides, finance; case 2026-11-23-map-1, calls 7725afb9…, 77ee2161…`. `pnpm -s case cite <caseId> <issue>…` records the issues in the case's `observations` and pushes the cases repo.

## Replaying calls

`pnpm replay <caseId> <callId>… [--prompt current|archived] [--model <id>]` sends archived calls again, one after another, on the model they ran on (`--model` picks another) and prints for each the archived and the new answer with a line comparing them (text length, tool calls, the length of each list in a JSON answer, such as `kcs 7 → 4`) and its cost. It needs `ALLOW_LIVE_AI=1` ([live-ai.md](live-ai.md)), and spends Gateway credit on Muse: about a cent per call. With `AI_PROVIDER=mock` it checks the plumbing for free.

- **What it covers:** the build's text calls (`extract-chapter`, `extract-exercises`, `group-exercises`, `check-prerequisites`, `topic-tree`) and `chat-reply` steps. Page reads send page images and are refused.
- **`--prompt current`** (the default): a build call is made by this checkout's prompt builder from the data it sent then (`MAP_CALL_REPLAYS` in the knowledge-map feature), so a changed prompt, schema or way of writing the data shows; a change to which data is offered does not. A Chat step gets this checkout's tutor instructions with the messages, tutor context and tools as archived, so a changed tool description or context does not show. The header says whether the instructions changed since the archive: if not, the replay shows only the model's variance.
- **`--prompt archived`** keeps the system prompt the call had: run it to see how much an answer varies on its own before reading a difference as a prompt's effect.
- **Kept:** every live replay is written to `cases/<caseId>/replays/<time>.json` with the model, the prompt mode, the checkout's commit (`-dirty` with uncommitted changes) and the answer, and pushed. Mock replays are not kept.
