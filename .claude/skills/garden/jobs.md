# Garden jobs

`/garden` runs without an issue: the job in your prompt is your spec. Every commit carries the scope `garden` (`refactor(garden): …`), which keeps it out of the next run's change counts. Your handoff may run to 500 words: the report is built from it.

## `simplify`

Your prompt names one area and the changes the maintainer rejected there; propose none of them again. Make the area simpler for the next agent or human who changes it. Simplicity is lost in the big picture first, so work top-down through three levels, in order:

1. **Structure.** Start from `pnpm -s garden:areas map <area>` (modules, who imports what from whom, cycles, files by change with their complex functions) and the area's doc in `docs/features/`, if any. Read the entry files and each module's main files until you can describe the area in a few lines: what each module is for, who calls whom, how the data flows. Then question that picture. Does each module have one job, named with a `GLOSSARY.md` term? Does one concept live in two modules, or one module hold two concepts? Does a layer only pass calls through? Does a cycle say two modules are really one, or one is really two? Is the public API wider than its users need? Changes here come first: they decide which lines are still worth polishing.
2. **Seams.** The interfaces between modules and files: types copied or converted back and forth, arguments threaded through several calls, adapters, options no caller passes, a function exported for its only caller.
3. **Lines.** The files that change most and the complex functions the map lists: duplicated logic, branches no input reaches, names that contradict `GLOSSARY.md`, comments and docs that contradict the code.

Done means every level was examined with the map in hand, and every finding ends in a commit or a one-line reason to leave it. Removing `export` keywords, formatting and similar mechanical cleanups are knip's and the linters' work: they count as no finding.

Behaviour stays the same. Prompts, tool descriptions, UI copy and any other text a Student or a model reads stay word for word. Every test keeps checking what it checked: a test moves or changes shape with the code it covers, and the handoff names each such test with its reason. A change that reaches into another area, such as narrowing this area's API, updates the callers there. Commit each change on its own, so a rejected one can be dropped. When one problem shows up in two or more places, add a lint rule or a knip or CI threshold that catches it from then on.

Handoff, per level: each change with why it is simpler, each finding left with its reason. Then each test changed or deleted with its reason, and each rule added.

## `break`

Find the bugs a Student would hit in the areas your prompt names. The mock AI answers the same way every time, so bugs hide where the code assumes something. Read the areas' server code, actions and workflows first, and list the assumptions they make about:

- **order**: a step before its input exists, a click during a build, two tabs;
- **repetition**: a double submit, a retry after a step failed halfway, a workflow step that runs twice;
- **state**: a missing row, a half-finished close, a deleted Material, another Student's id;
- **input**: empty, very long, odd characters;
- **model output**: an error, a timeout, empty or malformed output (`pnpm -s agent up --mock-fault <error|timeout|empty|malformed>`), and in unit tests with crafted output, ids that do not exist or fields out of range.

Prove or refute each assumption: with a test at the cheapest seam, or in the running app with `pnpm -s agent` (the `run-app` skill). A comment calling a behaviour intended is a claim to check against what the Student sees. Done means every assumption on your list is proved or refuted.

For each small bug, commit a failing test first (`test(garden): …`) and keep its failing output, then the fix (`fix(garden): …`). A larger bug, or one outside the areas, becomes an inbox issue ([issue-tracker.md](../../../docs/agents/issue-tracker.md)). End with `pnpm -s agent up`, which turns the fault off.

Handoff: the assumptions, one line each with how you checked it and the outcome; per bug its test commit, the failing output and a step to try on the preview; the issues filed.

## `garden finish`

The builder's `finish` job without an issue, smoke check or `Try it`. Then `pnpm -s agent walk <dir>/walk-after` and `pnpm -s agent walk diff <dir>/walk-before <dir>/walk-after`: a changed page that no listed bug fix explains is a regression to fix. Then `pnpm -s garden:areas write <dir>/before.json <areas>`, and fill each section of `docs/garden/<date>.md` from the handoffs, the reviews and the diff (`git diff --stat origin/main...HEAD` finds the changed tests), quoting each bug test's passing output at HEAD beside its failing one. Commit as `docs(garden): report <date>`.
