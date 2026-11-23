# Leak guards for real Materials

**Context.** The repo is public, and so is every pushed branch, issue, PR and comment. Real Courses on staging hold Materials of other people (lecture slides, scripts), and analysing real map builds and Chats puts their text within reach of agents that commit and write GitHub text (#382).

**Decision.**

- **Document files need an allowlist line.** A commit or push that adds or changes a PDF, PPTX, PPT, DOCX, DOC, KEY or ODP file fails unless `tools/leak-guard/allowlist.txt` lists its path and sha256. Pre-commit checks the staged files; pre-push checks every file of the pushed range, so `--no-verify` on the commit alone does not get a file out. `pnpm gold pull` and `pnpm gold export` refuse a Course with a Material whose file is not listed.
- **Quotes are caught by fingerprints.** `pnpm leak-guard fingerprints` reads every staging chunk (read-only), skips Courses whose Materials are all allowlisted (matched by name and size, since the database holds no file hash), normalises the text to lowercase letters and digits, and stores the first 16 hex characters of the sha256 of every 8-word window. Pre-push refuses an added line containing such a window, and the `gh` hook in `.claude/hooks/guard-bash.sh` refuses `gh issue|pr create|edit|comment` and `gh api` calls with a body (inline or from a file) before they run. Both name the file and line, never the Material. There is no override: the line gets rewritten.
- **Fingerprints fail closed.** Without the file, both checks refuse and name the command that makes it.
- **The private cases repo holds everything derived from real Materials.** The fingerprints live in `MASTERY_CASES_DIR` (default `~/project-mastery-cases`), never in this repo, and so will case files, PDFs and analyses of real Courses.

**Consequences.** Real text cannot leave through a commit, push or `gh` call without a rewrite. The checks do not cover images, artifacts or Langfuse (private), and a GitHub Action would come too late for a pushed branch. A quote shorter than 8 words, or reworded, passes. New real Materials need `fingerprints` run again before the next push.
