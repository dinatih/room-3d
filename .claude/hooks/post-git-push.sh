#!/usr/bin/env bash
# PostToolUse hook for `git push`. Polls GitHub Actions for the pushed
# commit; exits 2 (blocking) on workflow failure so Claude is woken with
# the failure log. Silent on success / in-progress beyond timeout.
set -uo pipefail

# Hook stdin is JSON; we don't need it. The `if` filter in settings already
# scoped this to `git push *`, but be defensive in case the script is run
# manually.

# Read stdin so the model harness gets EOF.
cat >/dev/null 2>&1 || true

# Require gh + jq + git.
command -v gh  >/dev/null 2>&1 || exit 0
command -v jq  >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0

sha=$(git rev-parse HEAD 2>/dev/null) || exit 0
short=${sha:0:7}

# Poll up to ~150s for the run to register + complete (or fail fast).
for _ in $(seq 1 30); do
  sleep 5
  run=$(gh run list --commit "$sha" --limit 1 \
          --json status,conclusion,databaseId,workflowName \
          2>/dev/null) || continue
  [ -z "$run" ] || [ "$run" = "[]" ] && continue

  status=$(jq -r '.[0].status' <<<"$run")
  conclusion=$(jq -r '.[0].conclusion' <<<"$run")
  workflow=$(jq -r '.[0].workflowName' <<<"$run")
  id=$(jq -r '.[0].databaseId' <<<"$run")

  if [ "$status" = "completed" ]; then
    if [ "$conclusion" = "failure" ]; then
      {
        echo "GitHub Actions FAILED: workflow='$workflow' run=$id sha=$short"
        echo "--- last 40 lines of failed log ---"
        gh run view "$id" --log-failed 2>&1 | tail -40
      } >&2
      exit 2
    fi
    # success / cancelled / skipped — don't bother the model
    exit 0
  fi
done

echo "GitHub Actions still in_progress after 150s for $short (run $id) — check manually" >&2
exit 0
