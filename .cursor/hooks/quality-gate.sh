#!/usr/bin/env bash
# Cursor stop hook.
# Cursor continues a turn with followup_message. Exit 2 is a hook failure here,
# not a "keep working" signal, so this wrapper always exits 0.
# loop_limit in .cursor/hooks.json caps repeats. The check itself is quality-gate.sh.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -t 0 ]]; then
  input=""
else
  input="$(cat || true)"
fi

status="$(printf '%s' "$input" | node --input-type=module -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  try {
    const data = raw.trim() ? JSON.parse(raw) : {};
    process.stdout.write(typeof data.status === "string" ? data.status : "");
  } catch {
    process.stdout.write("");
  }
});
')"

case "$status" in
  aborted|error)
    printf '%s\n' "{}"
    exit 0
    ;;
esac

set +e
err="$(bash "$ROOT/.claude/hooks/quality-gate.sh" </dev/null 2>&1)"
code=$?
set +e

if [[ "$code" -eq 0 ]]; then
  printf '%s\n' "{}"
  exit 0
fi

HOOK_MESSAGE="$err" node --input-type=module -e 'const message = process.env.HOOK_MESSAGE ?? "Quality gate failed."; process.stdout.write(JSON.stringify({ followup_message: message.slice(0, 6000) }) + "\n");'
exit 0
