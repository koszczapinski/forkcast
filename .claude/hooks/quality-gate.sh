#!/usr/bin/env bash
# Stop hook for Claude Code.
# Active only while .claude/tests.lock exists, so the red test-first step is not forced green.
# Exit 0: the gate is inactive, or pnpm check passed. Success prints nothing.
# Exit 2: pnpm check failed. stderr is the failure lines only.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 0

if [[ ! -t 0 ]]; then
  cat >/dev/null || true
fi

if [[ ! -f "$ROOT/.claude/tests.lock" ]]; then
  exit 0
fi

set +e
output="$(pnpm check 2>&1)"
code=$?
set +e

if [[ "$code" -eq 0 ]]; then
  exit 0
fi

echo "Quality gate failed. Fix the code. Do not edit or weaken approved tests." >&2
# Failure lines only. A full log is too large for the model; CI already stores it.
# Keep the failure summary and a short block under each FAIL, not the passing log.
failures="$(printf '%s\n' "$output" | awk '
  BEGIN { extra = 0 }
  /^[[:space:]]*$/ {
    if (extra > 0) { print; extra-- }
    next
  }
  {
    hit = ($0 ~ /error TS[0-9]+/) ||
      ($0 ~ /FAIL/) ||
      ($0 ~ /AssertionError/) ||
      ($0 ~ /Failed (Tests|Suites)/) ||
      ($0 ~ /^[[:space:]]*×/) ||
      ($0 ~ /^[[:space:]]*→/) ||
      ($0 ~ /^Error:/) ||
      ($0 ~ /[0-9]+:[0-9]+[[:space:]]+error/) ||
      ($0 ~ /✖/) ||
      ($0 ~ /ELIFECYCLE|ERR_PNPM|Command failed/) ||
      ($0 ~ /^[[:space:]]*(Test Files|Tests )/)
    if (hit) {
      print
      if ($0 ~ /FAIL/ || $0 ~ /AssertionError/ || $0 ~ /^Error:/) extra = 12
      else extra = 0
      next
    }
    if (extra > 0) { print; extra-- }
  }
')"
if [[ -z "$failures" ]]; then
  printf '%s\n' "$output" | tail -n 40 >&2
else
  printf '%s\n' "$failures" | head -n 40 >&2
fi
exit 2
