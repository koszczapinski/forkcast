#!/usr/bin/env bash
# Proves the Claude quality gate and the test lock, and the Cursor adapters.
# Restores the tree on exit. Not part of pnpm check.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TEST_FILE="$ROOT/src/lib/format-servings.test.ts"
SRC_FILE="$ROOT/src/lib/format-servings.ts"
LOCK="$ROOT/.claude/tests.lock"
PROBE="$ROOT/src/lib/lint-probe.ts"
BACKUP="$(mktemp)"

cleanup() {
  status=$?
  rm -f "$LOCK" "$PROBE"
  if [[ -f "$BACKUP" ]]; then
    cp "$BACKUP" "$TEST_FILE"
    rm -f "$BACKUP"
  fi
  exit "$status"
}
trap cleanup EXIT

cp "$TEST_FILE" "$BACKUP"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

expect_code() {
  expected="$1"
  actual="$2"
  label="$3"
  if [[ "$actual" -ne "$expected" ]]; then
    fail "$label (expected $expected, got $actual)"
  fi
  echo "ok: $label -> $actual"
}

printf '\n%s\n' 'throw new Error("deliberate quality-gate failure");' >> "$TEST_FILE"

bash "$ROOT/.claude/hooks/quality-gate.sh" </dev/null
expect_code 0 $? "quality gate stays inactive without tests.lock"

printf '%s\n' "spec: docs/specs/1-example.md" > "$LOCK"

set +e
bash "$ROOT/.claude/hooks/quality-gate.sh" </dev/null
red=$?
set +e
expect_code 2 "$red" "quality gate exits 2 when pnpm check is red"

set +e
cursor_out="$(printf '%s' '{"status":"completed","loop_count":0}' | bash "$ROOT/.cursor/hooks/quality-gate.sh")"
cursor_code=$?
set +e
expect_code 0 "$cursor_code" "cursor stop hook exits 0 when the gate is red"
printf '%s' "$cursor_out" | node --input-type=module -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  const data = JSON.parse(raw);
  if (typeof data.followup_message !== "string" || !data.followup_message.includes("Quality gate failed")) {
    console.error(raw);
    process.exit(1);
  }
});
' || fail "cursor followup_message missing"

run_protect() {
  printf '%s' "$1" | bash "$ROOT/.claude/hooks/protect-tests.sh"
}

set +e
run_protect "{\"tool_input\":{\"file_path\":\"$TEST_FILE\"}}" >/tmp/forkcast-protect-test.txt
protected=$?
set +e
expect_code 2 "$protected" "protect-tests blocks a test file while the lock exists"

set +e
run_protect "{\"tool_input\":{\"file_path\":\"$SRC_FILE\"}}" >/tmp/forkcast-protect-src.txt
allowed=$?
set +e
expect_code 0 "$allowed" "protect-tests allows a source file while the lock exists"

set +e
run_protect '{"tool_input":{"file_path":"src\\lib\\format-servings.test.ts"}}' >/tmp/forkcast-protect-win.txt
windows=$?
set +e
expect_code 2 "$windows" "protect-tests blocks a backslash test path"

rm -f "$LOCK"

set +e
run_protect "{\"tool_input\":{\"file_path\":\"$TEST_FILE\"}}" >/tmp/forkcast-protect-open.txt
unlocked=$?
set +e
expect_code 0 "$unlocked" "protect-tests allows a test file when the lock is gone"

cp "$BACKUP" "$TEST_FILE"

printf '%s\n' "export const broken = " > "$PROBE"
set +e
printf '%s' "{\"tool_input\":{\"file_path\":\"$PROBE\"}}" | bash "$ROOT/.claude/hooks/lint-file.sh" >/tmp/forkcast-lint-bad.txt
lint_bad=$?
set +e
expect_code 2 "$lint_bad" "lint-file exits 2 on a broken TypeScript file"
rm -f "$PROBE"

set +e
printf '%s' "{\"tool_input\":{\"file_path\":\"$SRC_FILE\"}}" | bash "$ROOT/.claude/hooks/lint-file.sh"
lint_ok=$?
set +e
expect_code 0 "$lint_ok" "lint-file exits 0 on a valid source file"

printf '%s\n' "spec: docs/specs/1-example.md" > "$LOCK"

bash "$ROOT/.claude/hooks/quality-gate.sh" </dev/null
expect_code 0 $? "quality gate exits 0 when pnpm check is green"

set +e
cursor_green="$(printf '%s' '{"status":"completed","loop_count":0}' | bash "$ROOT/.cursor/hooks/quality-gate.sh")"
cursor_green_code=$?
set +e
expect_code 0 "$cursor_green_code" "cursor stop hook exits 0 when the gate is green"
printf '%s' "$cursor_green" | node --input-type=module -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  const data = JSON.parse(raw);
  if (Object.prototype.hasOwnProperty.call(data, "followup_message")) {
    console.error(raw);
    process.exit(1);
  }
});
' || fail "cursor green output included followup_message"

echo "All hook checks passed."
