#!/usr/bin/env bash
# Hands a built branch to the maintainer, from the worktree:
#
#   tools/build/ready.sh <pr> <body-file>
#
# Pushes the branch, sets the PR body, marks the PR ready, arms auto-merge
# (the maintainer's approval is the merge) and then watches the checks until
# they finish. Run it in the background: the watch ends with the checks.
set -euo pipefail

if [[ $# -ne 2 || ! "$1" =~ ^[0-9]+$ ]]; then
  echo 'usage: tools/build/ready.sh <pr> <body-file>' >&2
  exit 1
fi
pr=$1
body=$2
[[ -f "$body" ]] || {
  echo "No body file at $body." >&2
  exit 1
}

git push --quiet origin HEAD
gh pr edit "$pr" --body-file "$body"
# Ready is a no-op error on a PR that is not a draft: carry on.
gh pr ready "$pr" || true
gh pr merge "$pr" --auto --squash
echo "PR #$pr is ready, auto-merge is armed. Watching the checks."
gh pr checks "$pr" --watch
