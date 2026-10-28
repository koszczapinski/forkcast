# 1-meal-preferences-form

## Goal

Let the user set their diet, allergies, number of servings, and weekly budget on the home page. These preferences are the input for the AI weekly plan generator (step 3).

## Acceptance criteria

1. Given no saved preferences, when the person opens `/`, then diet is a single choice, the selected value is `omnivore`, and the visible label is "Omnivore". Given a selected diet, when the person chooses "Vegetarian", "Vegan", or "Pescatarian", then that value is the only selected diet and the stored id is `vegetarian`, `vegan`, or `pescatarian`. Given any other diet id, when it is validated, then it is rejected.

2. Given the allergy options, when the person selects any subset, including none, then that subset is valid and both of two selected options stay selected. The only options are Gluten, Lactose, Nuts, Eggs, Fish, and Soy, stored as `gluten`, `lactose`, `nuts`, `eggs`, `fish`, and `soy`. Given an id outside that list, including `peanuts`, when it is validated, then it is rejected. Given a list that repeats an id, when it is validated, then it is rejected. The stored list contains each id at most once.

3. Given a fresh form, when it is shown, then servings is empty. Given servings, when the value is an integer from 1 to 6 inclusive, then it is valid and no servings error is shown. Given servings, when the value is outside that range, empty on submit, a non-integer (`1.5`, `2.0`, `02`, `+2`), or non-numeric text (`abc`), then it is invalid and the servings field's accessible description is "Enter a whole number from 1 to 6." The field accepts typed text, including `abc`, so validation sees that string. The visible label is "Servings".

4. Given the budget field labelled "Weekly budget (PLN)", when the person leaves it empty, then it is valid and the stored budget is `null`. Given a weekly amount, when it is a number greater than 0 with at most two decimal places, then it is valid, whether the person typed a dot (`150.50`, `0.01`) or a comma (`150,50`, `150,5`). The stored value is the number (`150.5` for both `150.50` and `150,50`). There is no maximum (`999999.99` is valid). Given zero, a negative number, more than two decimal places (`150.555`, `150,555`), a thousands separator (`1.000,50`, `1,000.50`, `1 000,50`), or a currency symbol (`100 zł`, `100 PLN`), when it is validated, then it is invalid and the budget field's accessible description is "Enter a positive amount in PLN, or leave this empty."

5. Given one or more invalid fields, when the person activates "Save preferences", then nothing is written to `localStorage`. A previous successful save is left unchanged, and an empty store stays without a `forkcast.preferences` entry. Focus moves to the first invalid field in this order: diet, allergies, servings, budget. When servings and budget are both invalid, focus is on servings. When servings is valid and budget is invalid, focus is on budget. Diet and allergies cannot be invalid through the form.

6. Given valid preferences, when the person activates "Save preferences", then `localStorage` key `forkcast.preferences` holds the saved JSON and the form keeps showing those values. There is no success toast and no other success message. Given that record, when the person reloads `/`, then after mount the form shows the saved diet, allergies, servings, and budget. An empty budget is stored as `null` and shows as an empty field. The server render and the first client render show the defaults and do not read `localStorage`. After mount, a valid record is shown. The saved shape is:

```json
{
  "diet": "vegetarian",
  "allergies": ["nuts", "soy"],
  "servings": 4,
  "budget": 100
}
```

7. Given validation of preferences and the TypeScript type of preferences, when either is needed, then both come from one Zod schema named `preferencesSchema`. Given that schema, when the rules in criteria 1–4 and the stored shape in criterion 6 are tested without the form, then those tests are unit tests of `preferencesSchema` on its own. The inferred type is `z.infer<typeof preferencesSchema>`. There is no second preferences type and no second schema.

8. Given the person opens `/`, when the page is shown, then the preferences form is on that page, the level-1 heading is "Forkcast", and the "Plan a week" button is visible and disabled. "Plan a week" does not save preferences. Labels are English, as named in the criteria above.

## Edge cases

- Given `localStorage["forkcast.preferences"]` is corrupted (`{`) or outdated (JSON that `preferencesSchema` rejects, including `{"diet":"keto"}` and a record that is only partly valid), when the person opens `/`, then the page renders and the whole record is dropped. The form shows the defaults: diet Omnivore, no allergies, servings empty, budget empty.

- Given non-numeric text in servings or in budget, when the person submits, then that field shows its error from criteria 3 or 4, nothing is saved, and focus follows criterion 5.

- Given `localStorage` is unavailable during the server render, when the page renders, then it does not throw and it shows the defaults.

## Tests first

This file does not add tests. The implementation ticket writes them first and shows them failing because the form and `preferencesSchema` are missing, not because of a typo or a bad import. The skeleton does not depend on Zod yet; adding that dependency belongs to that later ticket.

Component tests use React Testing Library. They assert what the person sees and can do, including accessible names and accessible descriptions. They do not snapshot markup, and they do not require a radio, a checkbox, or a `<select>`. They do not need MSW. They submit with the button "Save preferences". An error under the field is that field's accessible description. Pixel placement and an axe scan belong to issue #4, not to this ticket.

1. Criterion 1 -> unit test of `preferencesSchema`, plus one component test.
   - Unit (Vitest): `omnivore`, `vegetarian`, `vegan`, and `pescatarian` are accepted. Any other diet string is rejected. A diet value is one string.
   - Component (React Testing Library): with empty storage, after mount, "Omnivore" is the selected diet. Choosing "Vegetarian" leaves "Omnivore" unselected.

2. Criterion 2 -> unit test of `preferencesSchema`, plus one component test.
   - Unit (Vitest): `[]` is accepted. Each of `gluten`, `lactose`, `nuts`, `eggs`, `fish`, and `soy` is accepted, including `["nuts", "soy"]`. `peanuts` is rejected. `["nuts", "nuts"]` is rejected.
   - Component (React Testing Library): the person can select Nuts and Soy together, clear both, and save with none selected when servings is `2` and budget is empty.

3. Criterion 3 -> unit test of `preferencesSchema`, and a component test for the message.
   - Unit (Vitest): `1` and `6` are accepted. `0`, `7`, and `1.5` are rejected.
   - Component (React Testing Library): a fresh form shows an empty Servings field. Submitting it, entering `0`, entering `7`, entering `2.0`, entering `02`, entering `+2`, and entering `abc` each set the servings field's accessible description to "Enter a whole number from 1 to 6." Entering `4` shows no servings error. The `abc` test types that string and the field still exposes it to validation.

4. Criterion 4 -> unit test of `preferencesSchema`, and a component test for typing and the message.
   - Unit (Vitest): omitted budget and `null` are accepted. `100`, `0.01`, `150.5`, and `999999.99` are accepted. `0`, `-1`, and `150.555` are rejected.
   - Component (React Testing Library): the field's accessible name is "Weekly budget (PLN)". Empty budget saves `null`. Typing `150.50` and typing `150,50` each save the number `150.5`. Typing `150,5` saves `150.5`. Typing `0`, `-1`, `150.555`, `1.000,50`, `100 zł`, and `100 PLN` each set the budget field's accessible description to "Enter a positive amount in PLN, or leave this empty."

5. Criterion 5 -> component test (React Testing Library).
   - Save diet Vegetarian, Nuts, servings `4`, and budget `100`. Submit again with servings `0` and budget `-1`. `forkcast.preferences` is unchanged and focus is on Servings.
   - With servings `2` and budget `0`, focus moves to Weekly budget (PLN).
   - With no prior save and servings `0`, submit leaves `localStorage` without `forkcast.preferences`.

6. Criterion 6 -> component test (React Testing Library) and one end-to-end test.
   - Component: activate "Save preferences" with Vegetarian, Nuts and Soy, servings `4`, and budget `100`. The key `forkcast.preferences` is the JSON object in criterion 6. The form still shows those values. No success message is shown. A second case saves Omnivore, no allergies, servings `1`, and an empty budget; the stored `budget` is `null`, and after mount the budget field is empty. With a saved record already in `forkcast.preferences`, `renderToString` does not read `localStorage` and shows the defaults. After a client mount, the form shows the saved record.
   - End-to-end (Playwright, `e2e/preferences.spec.ts`): open `/`, save the same values, reload, and see those values after load. The page reports no hydration error and shows no success toast.

7. Criterion 7 -> the unit test file of `preferencesSchema` on its own.
   - The file imports `preferencesSchema` and does not render React.
   - The schema cases in rows 1–4 and the stored shape in row 6 live in that file.
   - The type under test is `z.infer<typeof preferencesSchema>`.

8. Criterion 8 -> the existing home end-to-end test, plus the preferences end-to-end test.
   - `e2e/home.spec.ts` still finds the heading "Forkcast" and the button "Plan a week".
   - `e2e/preferences.spec.ts` finds the preferences form on `/` and finds "Plan a week" visible and disabled.

9. Corrupted or outdated `localStorage` -> component test (React Testing Library) on key `forkcast.preferences`.
   - Stored value `{`: the page renders, the diet is Omnivore, no allergy is selected, servings is empty, and budget is empty.
   - Stored value `{"diet":"keto"}`, and a partly valid value such as `{"diet":"vegan","allergies":["nuts"],"servings":9}`: the same defaults. The vegan diet and the nut allergy from the partial record are not kept.

10. Missing `localStorage` during server render -> component test. `renderToString` the form with no `localStorage`. The render does not throw and shows Omnivore, no allergies, empty servings, and an empty budget.

## Out of scope

- Database persistence, auth, AI generation.
- The 14 allergens in Regulation (EU) No 1169/2011 Annex II. This ticket stores the six ids from the issue.
- A cross-check between diet and allergies. A pescatarian may select Fish.
- Turning "Plan a week" into plan generation. The button stays disabled.

## Depends on

- Step 1 (project skeleton + harness) merged to `main`. Pull request #5 is merged, so this dependency is met.

The owner adds `spec:approved` after reviewing this spec, and adds `agent:ready` only when implementation may start. This spec does not add or remove those labels.

## Decisions

The owner accepted the former open questions. They are requirements in the criteria above.

1. Allergies are the six ids from the issue, not the 14 EU allergens.
2. The budget is per week, in PLN. Empty is `null`. A provided amount is greater than 0, with at most two decimal places, and has no maximum. The field accepts `.` and `,`.
3. Servings starts empty. Only a whole number from 1 to 6 is valid. Otherwise the message is "Enter a whole number from 1 to 6."
4. The storage key is `forkcast.preferences`. An invalid record is dropped. The form reads storage after mount.
5. Focus order is diet, allergies, servings, budget.
6. The form is on `/`. The "Forkcast" heading and the disabled "Plan a week" button stay.
7. Copy is English. The submit control is "Save preferences". A successful save shows no toast.
