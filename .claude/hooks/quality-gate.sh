#!/usr/bin/env bash
# Stop hook for Claude Code.
# Active only while .claude/tests.lock exists, so a red test-first step can still stop and ask.
# Exit 0: the gate is inactive, or pnpm check passed.
# Exit 2: pnpm check failed. stderr is why Claude must keep working.
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
printf '%s\n' "$output" | tail -n 80 >&2
exit 2
