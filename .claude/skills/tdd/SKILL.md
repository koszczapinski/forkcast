---
name: tdd
description: Write failing tests from an approved spec, then lock them after the reviewer passes. The user invokes this with /tdd. An agent:ready run follows it without waiting for another prompt.
disable-model-invocation: true
---

Input: a path under `docs/specs/`. The approved spec is the contract. Do not wait for a separate plan approval.

Do not start unless the owner has set `spec:approved` and `agent:ready` on the issue. If you cannot see the labels, ask. Never set those labels yourself. Never merge.

Treat the work as `risk:high` when it touches the harness (`.claude`, `.cursor`, `.github`, `AGENTS.md`, `CLAUDE.md`), AI prompts, auth, payments, schemas, dependencies, or secrets. Do not set the label. The owner does. For that work, stop after the red tests (step 7).

This run writes the tests and, unless the work is `risk:high`, implements in the same agent. Use a strong model for that agent. The reviewer subagent stays cheap. See `docs/workflow.md`.

1. For each acceptance criterion, write at least one test.
   Logic, hooks, validation, and bugs: a unit test or a Testing Library test.
   A bug starts with a regression test that fails on `main`.
   A purely visual change: propose a Playwright check or a screenshot instead of a unit test.
2. Test behaviour, not markup and not implementation details. Follow the existing test files.
3. Component tests that call `fetch` use the MSW server in `src/test/msw/server.ts` via `server.use`.
4. Run only the new tests. Keep the failure summary (failing names and assertion errors). Do not read or paste the full log. They must fail for the right reason (missing behaviour, not a typo or a bad import).
5. Do not write implementation code yet.
6. Invoke the read-only `reviewer` subagent for the tests pass, with the spec path, the new test files, and the failure summary. The spec is the contract, not a file that must appear in the diff. The reviewer checks that every criterion has a test, that the tests are red for the right reason, and that they assert behaviour.
   - Pass: continue to step 7.
   - Fail: fix the tests and review again. At most two fix rounds. If the reviewer still fails, stop and report the gaps. Do not create `.claude/tests.lock` and do not implement.
7. On pass:
   - Default: commit `test: <short imperative summary>`, create `.claude/tests.lock` (gitignored; one line, the spec path), and implement in the same run. Do not wait for the owner. Do not add a dependency that `docs/tech-stack.md` does not allow.
   - `risk:high`: commit the red tests, open a draft pull request, and stop. The title is the issue title. The body contains `Closes #<issue>`, states that the tests are red on purpose, and names `risk:high` without applying the label. Do not create the lock and do not implement until the owner approves the tests. After that approval, create the lock and implement on the same branch.

```bash
gh pr create --draft --title "feat: Meal preferences form" --body-file /tmp/forkcast-pr.md
```

8. An approved test changes only together with a spec change the owner has approved. While `.claude/tests.lock` exists, the hook blocks the edit. Delete the lock, update the spec and the tests together, have the reviewer check the tests again, then create the lock. The reviewer fails a test change with no spec change. Do not delete the lock to make a red suite pass.
