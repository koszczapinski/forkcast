---
name: tdd
description: Write failing tests from an approved spec before any implementation. The user invokes this with /tdd.
disable-model-invocation: true
---

Input: a path under `docs/specs/` and the approved plan.

Do not start unless the owner has set `spec:approved` and `agent:ready` on the issue. If you cannot see the labels, ask. Never set those labels yourself.

1. For each acceptance criterion, write at least one test.
   Logic, hooks, validation, and bugs: a unit test or a Testing Library test.
   A bug starts with a regression test that fails on `main`.
   A purely visual change: propose a Playwright check or a screenshot instead of a unit test.
2. Test behaviour, not markup. Follow the existing test files.
3. Component tests that call `fetch` use the MSW server in `src/test/msw/server.ts` via `server.use`.
4. Run only the new tests. Show the output. They must fail for the right reason (missing behaviour, not a typo or a bad import).
5. Do not write implementation code. Stop and ask the user to review the tests.
6. After an explicit approval: commit as `test: <short imperative summary>` and create `.claude/tests.lock`.
   The lock file is gitignored. One line is enough: the spec path.
