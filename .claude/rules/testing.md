---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
---

# Tests

Approved tests are a contract once `.claude/tests.lock` exists. The hook blocks edits while that file exists. After the owner approves a spec change, delete the lock, change the spec and the tests together, then lock again. If the spec did not change, stop and report. The reviewer fails a test change with no spec change.

Test behaviour. A bug fix starts with a regression test that fails on `main`.

Component tests that need HTTP use `server.use` from `src/test/msw/server.ts`.
