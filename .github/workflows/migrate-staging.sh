#!/usr/bin/env bash
# Applies this checkout's supabase/migrations to a database that other PRs'
# migrations may already be on (ADR 0030). Usage: migrate-staging.sh <db-url>
# Run from the repository root. Writes placeholder files into supabase/migrations
# of the checkout, so run it only in a throwaway checkout.
set -euo pipefail

db_url="${1:?usage: migrate-staging.sh <db-url>}"

# The CLI compares versions only: a version in the database's history without a
# local file fails the push. An empty file for each stands in for the other PR's
# migration, and --include-all applies this branch's migrations older than the
# newest one on staging.
supabase migration list --remote="$db_url" --output-format json > migration-list.json
jq -r '.migrations[] | select(.local == "") | .remote' migration-list.json | while read -r version; do
  [ -n "$version" ] && : > "supabase/migrations/${version}_on_staging.sql"
done

status=0
supabase db push --remote="$db_url" --yes --include-all > push.log 2>&1 || status=$?
cat push.log
if [ "$status" -ne 0 ]; then
  echo "::error::supabase db push failed (exit $status), see the log above."
  exit "$status"
fi
