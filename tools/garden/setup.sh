#!/usr/bin/env bash
# Prepares the worktree that /garden works in:
#
#   tools/garden/setup.sh [areas]
#
# Run it from the root of the worktree that EnterWorktree created. It renames
# the branch to `garden/<date>`, links the main checkout's .env.local, installs
# dependencies, lists the closed, unmerged garden PRs whose rejections the
# ledger does not hold yet, and lists the areas with the ones it would pick
# (default 2). Safe to run again on the same day.
set -euo pipefail

usage='usage: tools/garden/setup.sh [areas]'
areas=${1:-2}
[[ "$areas" =~ ^[1-9][0-9]*$ ]] || {
  echo "$usage (got '$*')" >&2
  exit 1
}

root=$(git rev-parse --show-toplevel)
main=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
cd "$root"
if [[ "$root" == "$main" ]]; then
  echo "Run this inside the /garden worktree (EnterWorktree first), not in the main checkout." >&2
  exit 1
fi

branch="garden/$(date +%F)"
[[ "$(git branch --show-current)" == "$branch" ]] || git branch -m "$branch"
[[ -e .env.local ]] || ln -s "$main/.env.local" .env.local
pnpm install --frozen-lockfile --prefer-offline --reporter=silent
echo "Ready: $branch at $(git log -1 --format='%h %s')."

recorded='[]'
[[ -f docs/garden/ledger.json ]] && recorded=$(jq -c '[.rejected[].pr]' docs/garden/ledger.json)
rejected=$(gh pr list --state closed --limit 200 --json number,title,headRefName,mergedAt \
  --jq '.[] | select((.headRefName | startswith("garden/")) and .mergedAt == null) | "#\(.number) \(.title)"' |
  jq -Rr --argjson recorded "$recorded" 'select((ltrimstr("#") | split(" ")[0] | tonumber) as $n | $recorded | index($n) | not)')
echo
if [[ -n "$rejected" ]]; then
  echo "Closed garden PRs to record:"
  echo "$rejected"
else
  echo "No closed garden PRs to record."
fi

echo
pnpm -s garden:areas --areas "$areas"
