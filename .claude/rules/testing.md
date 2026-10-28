---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
---

# Tests

Approved tests are a contract once `.claude/tests.lock` exists. Do not edit or weaken them to make a task look done. If a test is wrong, stop and ask.

Test behaviour. A bug fix starts with a regression test that fails on `main`.

Component tests that need HTTP use `server.use` from `src/test/msw/server.ts`.
