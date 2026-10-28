@AGENTS.md

# Claude Code

- Skills in `.claude/skills/` are user-invoked: `/issue`, `/spec`, `/tdd`, `/pr-ready`. Do not start them on your own.
- `/issue` creates a GitHub issue only after the user confirms the draft, and only with `type:feature` or `type:bug` plus `needs-spec`.
- Do not implement a ticket until the owner has set `spec:approved` and `agent:ready`. Never add or remove `agent:ready`, `spec:approved`, or `risk:*`. Never merge.
- The Stop hook runs `.claude/hooks/quality-gate.sh`. It runs `pnpm check` only while `.claude/tests.lock` exists. Exit 2 means keep working. It is not a finished turn.
- PreToolUse `protect-tests.sh` blocks Edit and Write on test files while the lock exists. If a test is wrong, stop and ask. Do not work around the hook with a shell redirect.
- The reviewer subagent (`.claude/agents/reviewer.md`) is read-only. Invoke it before opening a PR.
- `.env` and `.env.*` are denied. Do not read or print them.
