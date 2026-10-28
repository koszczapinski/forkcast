---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
---

# Tests

Approved tests are a contract once `.claude/tests.lock` exists. Do not edit or weaken them to make a task look done. Change an approved test only together with a spec change the owner has approved. If the spec did not change, stop and report. The reviewer flags a test change with no spec change.

Test behaviour. A bug fix starts with a regression test that fails on `main`.

Component tests that need HTTP use `server.use` from `src/test/msw/server.ts`.
