#!/usr/bin/env bash
# PreToolUse: approved tests are a contract while .claude/tests.lock exists.
# Exit 0 allows the edit. Exit 2 blocks it in Claude Code and in Cursor.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCK="$ROOT/.claude/tests.lock"

if [[ -t 0 ]]; then
  input=""
else
  input="$(cat || true)"
fi

if [[ ! -f "$LOCK" ]]; then
  exit 0
fi

if ! file="$(printf '%s' "$input" | node "$ROOT/.claude/hooks/lib/edited-path.mjs")"; then
  echo "protect-tests: could not read the hook input. Refusing the edit while tests are locked." >&2
  exit 2
fi

file="${file//\\//}"

if [[ -z "$file" ]]; then
  exit 0
fi

case "$file" in
  *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.test.mjs|*.spec.ts|*.spec.tsx|*.spec.js|*.spec.jsx|*.spec.mjs|*/__tests__/*)
    message="Tests are locked. Change an approved test only together with a spec change the owner has approved. Do not edit or weaken it."
    echo "$message" >&2
    HOOK_MESSAGE="$message" node --input-type=module -e 'process.stdout.write(JSON.stringify({ permission: "deny", user_message: process.env.HOOK_MESSAGE, agent_message: process.env.HOOK_MESSAGE }) + "\n")'
    exit 2
    ;;
esac

exit 0
