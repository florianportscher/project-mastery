# Developer view outside production

**Context.** A wrong Knowledge map had to be traced by hand through SQL on staging: from a KC to its chunks, its unit and the call that wrote it. The maintainer wants to see a Course's map build on the staging preview, and agents want the same data as text (#337).

**Decision.**

- **Who.** A `developers` table holds the user ids of developer accounts. Its owner may read their own row; no role the app uses can write it, so a row is added with `agent staging-write` (secret key). Picked over `app_metadata`, which would mean editing auth users by hand.
- **Where.** Pages and data calls of the view live under `/dev/…` and answer 404 when `isProductionDeployment()` or when the signed-in account has no `developers` row (`requireDeveloper` in `features/dev-inspector`), checked on the server for every page and Server Action. The Course sidebar shows a Developer link under the same rule (`isDeveloper`).
- **What.** `course_build_snapshot(course_id)`, a `security invoker` SQL function, returns everything the parse and build stored for a Course as one jsonb, without chunk Markdown. The page and `pnpm -s agent inspect` both read it, so the join exists once. Reads go through the signed-in user's own client, so Row Level Security limits the view to the developer's own Courses; there is no admin client. The read-only staging role `agent_reader` may execute it.
- **Flags** are computed in TypeScript from the snapshot and the stored check report, with no vector math: near-duplicates come from the report's pairs.
- `features/dev-inspector` is UI for the maintainer, written fast: it is left out of coverage and Stryker, not out of the lint boundaries.

**Consequences.** Production never serves the view, whoever is signed in. A developer sees only their own Courses, so reviewing another account's build still goes through `agent staging-sql`. The snapshot's shape is a contract between the SQL function, `features/dev-inspector/types.ts` and the CLI.
