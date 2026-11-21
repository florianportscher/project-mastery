#!/usr/bin/env bash
# Removes agent worktrees whose PRs are merged or closed, from the main checkout:
#
#   tools/build/cleanup.sh [spec-issue ...]
#
# Without an issue it goes through every worktree under `.claude/worktrees/`;
# with issues, only `.claude/worktrees/build-<issue>`. For each it stops the
# processes running in the worktree (the dev server from `pnpm -s agent up` and
# any other process whose working directory is inside it), removes the worktree
# and deletes its branch. It lists and keeps a worktree that has
# uncommitted changes, whose branch has no PR or an open one, and the
# `chore/279-*` one until #342 is merged. At the end it prunes stale worktree
# records and the remote branches GitHub deleted, and fast-forwards `main` when
# it is checked out.
set -euo pipefail

usage='usage: tools/build/cleanup.sh [spec-issue ...]'
main=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
if [[ "$(git rev-parse --show-toplevel)" != "$main" ]]; then
  echo "Run this in the main checkout, not in a worktree." >&2
  exit 1
fi

# Prints why a worktree stays and returns 1, or removes it and returns 0.
cleanup() {
  local worktree=$1 branch state changes pid cwd
  local name=${worktree#"$main"/}
  [[ -d "$worktree" ]] || {
    echo "No worktree at $name." >&2
    return 1
  }

  branch=$(git -C "$worktree" branch --show-current)
  # TODO(#342): drop this once #342 is merged.
  if [[ "$branch" == chore/279-* ]]; then
    echo "Kept: $name ($branch) waits for #342." >&2
    return 1
  fi

  state=$(gh pr list --head "$branch" --state all --json number,state --jq '.[0] | select(.) | "\(.state) #\(.number)"')
  case "$state" in
    "")
      echo "Kept: no PR for $branch." >&2
      return 1
      ;;
    OPEN*)
      echo "Kept: the PR of $branch is still open (${state#OPEN })." >&2
      return 1
      ;;
  esac
  changes=$(git -C "$worktree" status --porcelain)
  if [[ -n "$changes" ]]; then
    echo "Kept: $name has uncommitted changes:" >&2
    echo "$changes" >&2
    return 1
  fi

  # Finds processes by their working directory, not by name: `pkill -f` would
  # also match the shell running this script.
  if [[ -d "$worktree/node_modules" ]]; then
    (cd "$worktree" && pnpm -s agent down >/dev/null 2>&1) || true
  fi
  for pid in $(ls /proc 2>/dev/null | grep -E '^[0-9]+$'); do
    [[ "$pid" == "$$" || "$pid" == "$PPID" ]] && continue
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null) || continue
    [[ "$cwd" == "$worktree" || "$cwd" == "$worktree"/* ]] && kill "$pid" 2>/dev/null || true
  done

  # --force: the linked .env.local and node_modules are untracked files.
  git worktree remove --force "$worktree" || return 1
  # -D: a squash merge leaves the branch unmerged in git's eyes.
  git branch -D --quiet "$branch" || return 1
  echo "Removed $name and $branch (PR ${state#* })."
}

status=0
if [[ $# -gt 0 ]]; then
  for issue in "$@"; do
    [[ "$issue" =~ ^[0-9]+$ ]] || {
      echo "$usage (got '$issue')" >&2
      exit 1
    }
  done
  # A named issue that stays is an error; in a sweep over all it is the rule.
  for issue in "$@"; do
    cleanup "$main/.claude/worktrees/build-$issue" || status=1
  done
else
  for worktree in "$main"/.claude/worktrees/*/; do
    [[ -d "$worktree" ]] || continue
    cleanup "${worktree%/}" || true
  done
fi

git worktree prune
git fetch --prune --quiet
if [[ "$(git branch --show-current)" == main ]]; then
  git pull --ff-only --quiet && echo "main is at $(git log -1 --format='%h %s')."
fi
exit "$status"
