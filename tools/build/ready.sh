#!/usr/bin/env bash
# Hands a built branch to the maintainer, from the worktree:
#
#   tools/build/ready.sh <pr> <body-file>
#
# Pushes the branch, sets the PR body, marks the PR ready, arms auto-merge
# (the maintainer's approval is the merge) and then watches the checks until
# they finish. Run it in the background: the watch ends with the checks.
set -euo pipefail

pr=$1
body=$2

git push --quiet origin HEAD
gh pr edit "$pr" --body-file "$body"
gh pr ready "$pr"
gh pr merge "$pr" --auto --squash
echo "PR #$pr is ready, auto-merge is armed. Watching the checks."
gh pr checks "$pr" --watch
