#!/usr/bin/env bash
# Cursor postToolUse adapter for lint-file.sh.
# additional_context is how Cursor shows the failure. Exit 0 so the JSON is read.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -t 0 ]]; then
  input=""
else
  input="$(cat || true)"
fi

set +e
err="$(printf '%s' "$input" | bash "$ROOT/.claude/hooks/lint-file.sh" 2>&1)"
code=$?
set +e

if [[ "$code" -eq 0 ]]; then
  printf '%s\n' "{}"
  exit 0
fi

HOOK_MESSAGE="$err" node --input-type=module -e 'const message = process.env.HOOK_MESSAGE ?? "Lint failed."; process.stdout.write(JSON.stringify({ additional_context: message.slice(0, 4000) }) + "\n");'
exit 0
