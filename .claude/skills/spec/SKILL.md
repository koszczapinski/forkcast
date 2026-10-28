---
name: spec
description: Turn an approved issue into a spec file with the same sections as the issue form. The user invokes this with /spec before any plan or code.
disable-model-invocation: true
---

Input: a GitHub issue number, or the issue text plus the number.

1. Read the issue with `gh issue view <number>`. Do not start from chat alone when an issue exists.
2. Write `docs/specs/<issue-number>-<slug>.md`.
   Use the same section order as the issue.
   A feature follows `.github/ISSUE_TEMPLATE/feature.yml` and `docs/specs/TEMPLATE.md`: Goal, Acceptance criteria, Edge cases, Tests first, Out of scope, Depends on.
   A bug follows `.github/ISSUE_TEMPLATE/bug.yml`: Steps to reproduce, Expected, Actual, Environment, Regression test.
3. Carry the criteria across. Do not add behaviour the issue does not state. If a required section is empty or not testable, ask, then stop.
4. Do not write product code, tests, or a plan.
5. Do not add or remove `agent:ready`, `spec:approved`, or `risk:*`. Tell the owner the spec is ready for `spec:approved`.
6. Stop and ask the owner to review the spec.
