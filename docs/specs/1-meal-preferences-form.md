# 1-meal-preferences-form

## Goal

Let the user set their diet, allergies, number of servings and weekly budget. These preferences are the input for the AI weekly plan generator (step 3).

The word "weekly" is the issue's wording. Open question 2 asks the owner to confirm the budget period. This goal does not settle it.

## Acceptance criteria

1. Given no saved preferences, when the person opens the form, then diet is a single choice and the selected value is `omnivore`. Given a selected diet, when the person chooses `vegetarian`, `vegan`, or `pescatarian`, then that value is the only selected diet. Given a diet other than `omnivore`, `vegetarian`, `vegan`, or `pescatarian`, when it is validated, then it is rejected.

2. Given the allergy options, when the person selects any subset, including none, then that subset is valid. Given two of the options, when the person selects both, then both stay selected. Given an allergy id outside the option list, when it is validated, then it is rejected. The issue names the options `gluten`, `lactose`, `nuts`, `eggs`, `fish`, and `soy`. Which list ships is Open question 1 and is not settled in this criterion.

3. Given the servings field, when the value is an integer from 1 to 6 inclusive, then it is valid. Given the servings field, when the value is outside that range, then it is invalid and the form shows an error message under the field. The integers 1 and 6 are valid. The integers 0 and 7 are outside the range. The message text, the initial servings value, and values that are not integers are Open question 3 and are not settled in this criterion.

4. Given the budget field, when the person leaves it empty, then it is valid. Given the budget field, when the person enters a positive number (greater than zero), then it is valid. Given the budget field, when the person enters zero or a negative number, then it is invalid. The issue calls this a weekly budget in PLN. Week versus meal, the currency, and the precision are Open question 2 and are not settled in this criterion.

5. Given one or more invalid fields, when the person submits, then nothing is saved. A previous successful save is left unchanged, and an empty store stays empty. Focus moves to the first invalid field. Which field is first is Open question 5 and is not settled in this criterion.

6. Given valid preferences, when the person submits, then the preferences are persisted in `localStorage`. Given that saved record, when the person reloads the page, then the form shows the saved diet, allergies, servings, and budget (an empty budget still shows as empty).

7. Given validation of preferences and the TypeScript type of preferences, when either is needed, then both come from one Zod schema named `preferencesSchema`. Given that schema, when the rules in criteria 1–4 are tested without the form, then those tests are unit tests of `preferencesSchema` on its own.

## Edge cases

- Given corrupted or outdated data in `localStorage`, when the person opens the page, then the page renders and the form falls back to the defaults: diet `omnivore`, no allergies, and an empty budget. The servings default, the storage key, and the meaning of "outdated" are Open questions 3 and 4 and are not settled in this bullet.

- Given non-numeric input in servings or budget, when the person enters it, then the outcome is Open question 3. The issue names the case and does not state what the person sees. The proposed default lives only in that question.

## Tests first

This file does not add tests. The implementation ticket writes them first and shows them failing because the form and `preferencesSchema` are missing, not because of a typo or a bad import. The skeleton does not depend on Zod yet; adding that dependency belongs to that later ticket.

Component tests use React Testing Library and assert what the person sees and can do. They submit through the control in Open question 7 (proposed accessible name: "Save preferences"). They do not snapshot markup, and they do not require a radio, a checkbox, or a `<select>`. They do not need MSW. An error "under the field" means the message is visible and is that field's accessible description, so focus lands on a field that announces it. Pixel placement and an axe scan belong to issue #4, not to this ticket.

Where a row below names a proposed default, that assertion waits until the owner confirms the open question. The row still names the test.

1. Criterion 1 -> unit test of `preferencesSchema`, plus one component test for what the schema cannot show.
   - Unit (Vitest): each of `omnivore`, `vegetarian`, `vegan`, and `pescatarian` is accepted. Any other diet string is rejected. A diet value is a single string.
   - Component (React Testing Library): with empty storage, the form shows `omnivore` as the selected diet. Choosing `vegetarian` leaves `omnivore` unselected.

2. Criterion 2 -> unit test of `preferencesSchema`, plus one component test for multi-select.
   - Unit (Vitest): the empty list is accepted. Each id on the confirmed option list is accepted, including a list of two. An id outside that list is rejected. Until Open question 1 is confirmed, the proposed list is `gluten`, `lactose`, `nuts`, `eggs`, `fish`, `soy`. That list is not a settled criterion.
   - Component (React Testing Library): the person can have two allergies selected at once, and can submit with none selected when diet, servings, and budget are otherwise valid.

3. Criterion 3 -> unit test of `preferencesSchema`, and a component test for the message.
   - Unit (Vitest): `1` and `6` are accepted. `0` and `7` are rejected.
   - Component (React Testing Library): the person enters `0`, and enters `7` in a separate render. Each time, a visible error message is the servings field's accessible description. The test does not assert the sentence in Open question 3 until the owner confirms it.

4. Criterion 4 -> unit test of `preferencesSchema`.
   - An omitted or empty budget is accepted. A positive number is accepted (use a whole amount such as `100`, which stays positive under the precisions in Open question 2). `0` and a negative number are rejected.
   - Decimal places, a comma separator, a currency symbol, and any maximum are not asserted until Open question 2 is confirmed.

5. Criterion 5 -> component test (React Testing Library).
   - Save a valid form, then submit again with servings `0`. The stored preferences are unchanged and the servings field has focus, once Open question 5 confirms that servings comes before budget.
   - With servings `2` and budget `0`, focus moves to the budget field under that same proposed order.
   - With no prior save and servings `0`, submit leaves the store without a preferences record.
   - The test reads the accessible error. It does not assert markup.

6. Criterion 6 -> component test (React Testing Library) and one end-to-end test.
   - Component: submit diet `vegetarian`, two allergy ids from the confirmed list (proposed: `nuts` and `soy`), servings `4`, and budget `100`. Unmount. Render a fresh form against the same `localStorage`. After the form has applied the stored record (Open question 4), it shows those values. A second case submits `omnivore`, no allergies, servings `1`, and an empty budget, and the fresh form shows an empty budget.
   - End-to-end (Playwright, `e2e/preferences.spec.ts`): the same save, then a real page reload, then the same visible values. The test opens the route from Open question 6. Proposed route until confirmed: `/`.

7. Criterion 7 -> the unit test file of `preferencesSchema` on its own.
   - The file imports `preferencesSchema` and does not render React.
   - The cases in rows 1–4 above live in that file.
   - The type under test is `z.infer<typeof preferencesSchema>`. There is no second, hand-written preferences type and no second schema.

8. Corrupted or outdated `localStorage` -> component test (React Testing Library), using the key from Open question 4 once confirmed. Proposed key until then: `forkcast.preferences`.
   - Stored value `{` (invalid JSON): the page renders, diet shows `omnivore`, no allergy is selected, budget is empty.
   - Stored value that `preferencesSchema` rejects, such as `{"diet":"keto"}`: the same fallback. The servings control shows the default from Open question 3.

9. Non-numeric servings or budget -> component test (React Testing Library). The assertion is the proposed default in Open question 3, after the owner confirms it: type `abc` into servings and into budget, see an error under that field, save nothing, and move focus as in criterion 5.

## Out of scope

- Database persistence, auth, AI generation.
- A cross-check between diet and allergies. A pescatarian may select fish. The issue states no such rule.
- The existing "Plan a week" control. It does not submit this form and it does not generate a plan.

## Depends on

- Step 1 (project skeleton + harness) merged to `main`. Pull request #5 is merged, so this dependency is met.

The owner adds `spec:approved` after reviewing this spec, and adds `agent:ready` only when implementation may start. This spec does not add or remove those labels.

## Open questions

The owner could not answer live. Each block ends with a proposed default. A proposed default is not an acceptance criterion. Criteria above keep the issue's words. Anything stricter than those words (precision, error copy, storage key, field order, route) becomes required only after the owner confirms it.

### 1. Allergen list

The issue names six options: `gluten`, `lactose`, `nuts`, `eggs`, `fish`, `soy`. Regulation (EU) No 1169/2011, Annex II, names 14 allergens:

1. Cereals containing gluten
2. Crustaceans
3. Eggs
4. Fish
5. Peanuts
6. Soybeans
7. Milk, including lactose
8. Nuts (tree nuts; peanuts are separate)
9. Celery
10. Mustard
11. Sesame seeds
12. Sulphur dioxide and sulphites
13. Lupin
14. Molluscs

The issue's six are a shorter starter list. They use `lactose` rather than milk, `gluten` rather than cereals containing gluten, and `nuts` in a way that does not match the EU split between peanuts and tree nuts. They omit crustaceans, peanuts, celery, mustard, sesame, sulphites, lupin, and molluscs. Issue #2 will reject dishes that violate the saved allergy ids, so the list chosen here is the list the weekly plan must enforce.

**Proposed default (not settled):** keep the six ids from the issue for this ticket. Store those ids. Leave the 14 EU allergens for a later decision. Do not add the missing eight in anticipation.

### 2. Budget period, currency, and precision

Criterion 4 says the budget is optional and, when provided, a positive number. The issue also calls it a weekly budget in PLN. Issue #2 says the prompt should respect servings and the optional weekly budget. Neither issue states:

- per week or per meal
- whether PLN is settled or only an example
- integer PLN or grosze (2 decimal places), and whether `150,50` is the same amount as `150.50`
- a maximum
- the stored empty value (`null`, omitted key, or `""`)
- a currency symbol in the field (`zł`, `PLN`)

A unit test can already reject `0` and negatives and accept an empty budget and a whole positive amount. It cannot honestly assert decimals, a comma, or a maximum.

**Proposed default (not settled):** one optional amount per week, in PLN. Empty stays empty and is stored as `null`. A provided value is a number strictly greater than 0, with at most 2 decimal places, and no maximum. Accept both `150.50` and `150,50`. Reject a third decimal place, a currency symbol, and thousands separators. The field label can say the amount is for the week only after this default is confirmed.

### 3. Servings initial value, non-integers, non-numeric text, and error copy

The issue requires an integer from 1 to 6, and an error message under the field when the value is outside that range. It does not state:

- what a fresh form shows in servings (empty, `1`, or something else)
- whether an empty servings field on submit is an error
- whether `1.5`, `2.0`, `02`, or `+2` is a valid integer
- the message sentence
- what non-numeric text (`abc`) does in servings or in budget
- whether an invalid budget shows an error under the budget field (the issue requires that placement for servings only)

"Fall back to defaults" needs a servings default. A non-numeric edge case needs an outcome. Criterion 5 needs the invalid budget field to be focusable; it does not by itself require a sentence under that field.

**Proposed default (not settled):** servings starts empty. Empty, non-integer, and non-numeric servings are invalid. On submit, the servings error is the visible accessible description "Enter a whole number from 1 to 6." Use the same pattern for an invalid budget. If Open question 2 keeps PLN, that sentence is "Enter a positive amount in PLN, or leave this empty." `2.0`, `02`, and `+2` are invalid text; the stored servings value is an integer from 1 to 6. The control must let the test type `abc` so validation sees that string. Corrupted storage falls back to an empty servings field.

### 4. Persistence, outdated records, and hydration

The issue says a successful save is in `localStorage`, a reload shows it, and corrupted or outdated data falls back to defaults without crashing. It does not name the key, the JSON shape, or what "outdated" means. It does not say whether a partially valid object keeps its valid fields. Next.js renders on the server, where `localStorage` is absent; the issue does not say when the saved values appear.

**Proposed default (not settled):** one key, `forkcast.preferences`, holding JSON:

```json
{
  "diet": "vegetarian",
  "allergies": ["nuts", "soy"],
  "servings": 4,
  "budget": 100
}
```

`budget` is `null` when empty. The allergy ids in the example are the proposed list from Open question 1. `allergies` contains each id at most once. "Outdated" means the raw value is not JSON or `preferencesSchema` rejects it, including an unknown diet, an unknown allergy, servings outside 1–6, or a non-positive budget. Rejection discards the whole record and uses defaults. The server render and the first client render show defaults and do not read `localStorage`. After mount, the form shows a valid saved record. A reload therefore ends on the saved values, which is what criterion 6 checks.

### 5. Which field is first for focus

Criterion 5 says focus moves to the first invalid field. The issue lists diet, then allergies, then servings, then budget, and does not say that list is the focus order. Diet is always one of the four values. Allergies may be empty. In practice only servings and budget can be invalid, so "first" matters when both are invalid.

**Proposed default (not settled):** form order is diet, allergies, servings, budget. When servings is invalid, focus servings even if budget is also invalid. When servings is valid and budget is invalid, focus budget.

### 6. Where the form lives

The issue does not name a route. The home page at `/` is a placeholder: heading "Forkcast", a disabled "Plan a week" button, and `e2e/home.spec.ts` asserts that heading and that button. Replacing that page would make the existing smoke test fail for a reason this ticket does not describe.

**Proposed default (not settled):** put the form on `/`, keep the "Forkcast" heading and the disabled "Plan a week" button, and leave `e2e/home.spec.ts` green.

### 7. Language, submit control, and success feedback

The issue writes English ids and does not give visible labels, a submit name, or a success message. The skeleton copy is English. The currency in the issue is PLN.

**Proposed default (not settled):** visible labels are English (`Omnivore`, `Vegetarian`, `Vegan`, `Pescatarian`, and the allergy ids as words). Stored values stay the English ids from the issue. The submit control's accessible name is "Save preferences". Submitting is that button. A successful save shows no extra confirmation. The form keeps the saved values, and the reload in criterion 6 is the proof.
