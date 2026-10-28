---
name: pr-ready
description: Open the pull request after the quality gate is green and the reviewer has passed. The user invokes this with /pr-ready. An agent:ready run follows it after implementation, not after a risk:high stop.
disable-model-invocation: true
---

Do not run this skill when `/tdd` stopped for `risk:high` or for a failed test review. A draft that only contains red tests is waiting for the owner. Do not implement, and do not mark that draft ready.

Input: the spec path and the branch name. `.claude/tests.lock` must exist. If it does not, stop.

1. Run `pnpm check`. Record the exit code. If it is red, read the failure summary only and fix the implementation. Do not read or paste the full log. Do not edit approved tests.
2. Invoke the `reviewer` subagent for the implementation pass, with the spec path and the changed files. If the verdict is fail, stop. A test change with no spec change is a fail. A test change that includes the spec change is allowed. A new dependency that `docs/tech-stack.md` does not allow is a fail.
3. Draft the pull request from `.github/pull_request_template.md`.
   The title is the issue title (`<type>: <summary>`). The body starts with `Closes #<issue>`.
   Sections: Spec, What changed, Evidence (commands and results), Why, Risk, Out of scope.
   Name `risk:high` when the diff touches `.claude`, `.cursor`, `.github`, `AGENTS.md`, `CLAUDE.md`, AI prompts, auth, payments, schemas, dependencies, or secrets. Otherwise name `risk:low`.
   Do not apply labels. The owner sets `risk:*`.
4. Open the pull request. If a draft already exists and the tests were approved, update it and mark it ready for review. Do not open a second pull request.
5. Do not merge. Do not add or remove `agent:ready`, `spec:approved`, or `risk:*`. Do not wait for the owner to confirm the text. The owner reviews at merge.
6. Delete `.claude/tests.lock` after the pull request is open.
