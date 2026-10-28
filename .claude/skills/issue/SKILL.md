---
name: issue
description: Turn a rough description into a GitHub issue in the Forkcast form, and create it only after the user confirms. The user invokes this with /issue.
disable-model-invocation: true
---

Input: a rough description from the user. It may be a feature or a bug.

The source of truth for the fields is `.github/ISSUE_TEMPLATE/feature.yml` and `.github/ISSUE_TEMPLATE/bug.yml`. Do not invent extra sections.

## Steps

1. Decide feature or bug from the description. A broken existing behaviour is a bug. New behaviour is a feature.
2. Draft every required section. Acceptance criteria must be numbered and testable. Given/When/Then is the preferred shape when it fits.
3. Ask at most 3 clarifying questions, and only when you cannot derive the acceptance criteria (or, for a bug, the expected vs actual behaviour). If the draft is specific enough to test, ask nothing.
4. Show the title and the full body. The title is `<type>: <short imperative summary>` with no trailing period. Features use `feat:`. Bugs use `fix:`.
5. Stop. Create the issue only after the user confirms the draft in this conversation.
6. On confirmation, create it with `gh issue create` and only these labels:
   - feature: `type:feature` and `needs-spec`
   - bug: `type:bug` and `needs-spec`
7. Never add `agent:ready`, `spec:approved`, or `risk:*`. Never merge. Paste the issue URL and stop.

```bash
gh issue create \
  --title "feat: Meal preferences form" \
  --label "type:feature" \
  --label "needs-spec" \
  --body-file /tmp/forkcast-issue.md
```

Use a body file so quotes in the body stay intact. Delete the temp file afterwards.

## Worked example

Rough input: "people should be able to say they are vegetarian and allergic to nuts, and the week of dinners should respect that."

No questions: the acceptance criteria can be derived.

Title: `feat: Meal preferences form`

Body:

```markdown
## Goal

A person can save that they are vegetarian and allergic to nuts, and a generated week of dinners contains neither meat nor nuts.

## Acceptance criteria

1. Given a new visitor, when they open preferences, then diet and allergy fields are empty.
2. Given a vegetarian diet and a nut allergy, when they save, then the stored preferences are vegetarian and nuts.
3. Given those saved preferences, when a week of dinners is drafted, then no dinner contains meat or nuts.

## Edge cases

- Saving with no allergy selected stores an empty allergy list.
- "Nuts" matches peanut and tree nut ingredients.

## Tests first

1. Criterion 1 -> component test of the empty form.
2. Criterion 2 -> unit test of the saved preference payload.
3. Criterion 3 -> unit test of the dinner filter.

## Out of scope

- Accounts, the streamed plan UI, and the shopping list.

## Depends on

- None
```

Labels on create: `type:feature`, `needs-spec`. Nothing else.
