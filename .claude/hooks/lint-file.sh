#!/usr/bin/env bash
# PostToolUse: lint the file that was just edited.
# Exit 2 shows the eslint output to Claude. The tool has already run.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 0

if [[ -t 0 ]]; then
  input=""
else
  input="$(cat || true)"
fi

if ! file="$(printf '%s' "$input" | node "$ROOT/.claude/hooks/lib/edited-path.mjs")"; then
  exit 0
fi

file="${file//\\//}"

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

if [[ ! -f "$file" ]]; then
  exit 0
fi

set +e
output="$(pnpm exec eslint --no-warn-ignored "$file" 2>&1)"
code=$?
set +e

if [[ "$code" -eq 0 ]]; then
  exit 0
fi

echo "Lint failed for $file:" >&2
printf '%s\n' "$output" | tail -n 40 >&2
exit 2
