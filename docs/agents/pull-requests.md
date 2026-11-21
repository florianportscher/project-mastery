# Pull requests

Every change reaches `main` through a PR that the maintainer reviews and squash-merges. Agents push branches and open PRs; they never push to `main`, and a PR merges only on the maintainer's approval. `/build` arms auto-merge (`gh pr merge <pr> --auto --squash`), so that approval is the merge.

**The one exception:** a Dependabot PR of the `minor-and-patch` group arms its own auto-merge (squash) when it opens (`.github/workflows/dependabot-automerge.yml`) and merges once the required checks pass. Majors and the `next-react` group stay manual.

The maintainer reviews on GitHub: they read the PR, try it on its Vercel preview, which runs on the staging project with their own Courses, and approve it or comment on it. A comment is a change request, built on the same branch by the next shift (`/build`). They run no command for a review: what a command can check is yours to run before the PR is ready.

- **Branch:** `<type>/<issue>-<kebab-description>`, or `<type>/<kebab-description>` without an issue. The type is a Conventional Commits type: `feat`, `fix`, `refactor`, `test`, `chore` or `docs`.
- **Title:** Conventional Commits, in lower case after the type (`feat: parse materials into chunks`). It becomes the commit on `main`.
- **Body:** write it with the Write tool into your scratchpad and pass it with `--body-file`, also for `gh pr edit`. Multi-line `--body` strings break on shell quoting.
- **Draft:** a long run opens the PR as a draft after its first commit (`gh pr create --draft --base main`), pushes as it goes, and runs `gh pr ready` when done.

## Body

Start with one or two sentences on why the change exists, then use these headings, leaving out any that would be empty:

- `## What changes`: the behaviour and structure that changed, grouped by topic, not by file.
- `## Decisions`: choices the issue left open, and why each was made.
- `## Deploying needs`: migrations (list them with `git diff --name-only origin/main...HEAD -- supabase/migrations`), environment variables and provider settings. Migrations apply themselves ([ADR 0030](../adr/0030-migrations-from-github-actions.md)): "Migrate staging" runs on the ready PR. Production changes only when the maintainer merges the release-please PR: "Migrate production", then "Deploy production", run behind the `database-production` approval, and nothing deploys if the migration fails. So a migration must stay backward compatible for one release cycle: no dropping or renaming a column or table the previous release reads. A PR that changes `.github/workflows/migrate.yml` or `release-please.yml` says so here. Write "Nothing beyond the code" if there are none.
- `## Try it`: the steps the maintainer takes in a browser on the PR's preview before approving, each with what they should see. Start from the issue's `Try it` steps as they turned out, and add a step for whatever only the maintainer's eyes can judge. When the change shows nothing in the app, write "Nothing to see in the app" and they approve from reading.
- `## Checked`: what ran and passed, with the result of each live check and command the issue names.
- `## Not verified`: what could not be checked, and why. Each line ends where it is picked up: a `Try it` step for the maintainer's eyes, or a `verify` issue ([issue-tracker.md](issue-tracker.md)) for what an agent can check with more time or a larger budget. A line worth neither says why.

End with `Closes #<n>` for every issue the PR resolves. Issues close when the PR merges, so leave them open.
