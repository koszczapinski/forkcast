---
name: pr-ready
description: Prepare the pull request after the quality gate is green and the reviewer has passed. The user invokes this with /pr-ready.
disable-model-invocation: true
---

Input: the spec path and the branch name.

1. Run `pnpm check`. Paste the result. If it is red, stop and fix the code. Do not edit approved tests.
2. Invoke the `reviewer` subagent with the spec path and the changed files. If the verdict is fail, stop.
3. Draft the pull request from `.github/pull_request_template.md`.
   The title is the issue title (`<type>: <summary>`). The body starts with `Closes #<issue>`.
   Sections: Spec, What changed, Evidence (commands and results), Dlaczego tak, Risk, Out of scope.
   Name `risk:high` when the diff touches `.claude`, `.cursor`, `.github`, `AGENTS.md`, `CLAUDE.md`, AI prompts, schemas, dependencies, or secrets. Otherwise name `risk:low`.
   Do not apply labels. The owner sets `risk:*`.
4. Do not merge. Do not add or remove `agent:ready`, `spec:approved`, or `risk:*`.
5. After the user confirms the PR text, delete `.claude/tests.lock`.
