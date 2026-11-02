# 4-ui-test-layer

## Goal

An agent or a person cannot change the Forkcast UI and miss an accessibility break or a layout break. The meal preferences screen from issue #1, rendered at `/`, is the first screen this layer covers. Component tests share one axe helper. Playwright scans every key page. Visual baselines for that screen are compared in light and dark, at a desktop viewport and a mobile viewport, inside one pinned Playwright image so two machines produce the same pixels.

## Acceptance criteria

1. Given a component rendered in Vitest, when a test calls `expectNoAxeViolations` from `src/test/axe.ts`, then the helper runs `axe-core` on that rendered container and fails only when a violation has impact `serious` or `critical`. The failure text includes each blocking rule id, impact, and target. `isBlockingAxeImpact` in `src/lib/axe-impact.ts` is the only definition of that pair of impacts, and the helper uses it. The helper disables the `color-contrast` rule, because jsdom does not paint. Incomplete results do not fail the helper. Given `MealPreferencesForm` with `localStorage` cleared, when the form has mounted and the "Omnivore" control is present, then `src/components/meal-preferences-form.axe.test.tsx` calls the helper on the form container and the helper passes. That file is new. `src/components/meal-preferences-form.test.tsx` stays unchanged. Given a serious or critical violation on that mounted form, when this ticket ends, then the product change that clears it is part of the ticket.

2. Given the key-page list in `e2e/key-pages.ts`, when Playwright opens a page under `pnpm e2e`, then `@axe-core/playwright` scans the whole document and the run fails when `isBlockingAxeImpact` is true for any violation. The list today is one entry, `{ path: "/", name: "home" }`. That URL is the meal preferences screen from issue #1 (the form, the "Forkcast" heading, and the disabled "Plan a week" button). `e2e/home.axe.spec.ts` clears storage, opens each entry, and expects `isBlockingAxeImpact` to be false for every violation. The scan uses `AxeBuilder` on the page, keeps the `color-contrast` rule, and uses the same `isBlockingAxeImpact` function as criterion 1. The test has no `@visual` tag, so it runs in the existing Chromium project on the host and in the existing CI end-to-end step. Given a serious or critical violation on `/`, when this ticket ends, then the product change that clears it is part of the ticket.

3. Given the key pages, when the visual suite runs, then each page has a Playwright `toHaveScreenshot()` baseline for light and dark and for desktop and mobile. For `/` the calls are `toHaveScreenshot("home-desktop-light.png")`, `toHaveScreenshot("home-desktop-dark.png")`, `toHaveScreenshot("home-mobile-light.png")`, and `toHaveScreenshot("home-mobile-dark.png")` in `e2e/home.visual.spec.ts`. With the default snapshot template, Playwright stores them as:

   - `e2e/home.visual.spec.ts-snapshots/home-desktop-light-chromium-linux.png`
   - `e2e/home.visual.spec.ts-snapshots/home-desktop-dark-chromium-linux.png`
   - `e2e/home.visual.spec.ts-snapshots/home-mobile-light-chromium-linux.png`
   - `e2e/home.visual.spec.ts-snapshots/home-mobile-dark-chromium-linux.png`

   The default snapshot name appends the browser and the platform. The config keeps the single project named `chromium` and does not set `snapshotPathTemplate`. With one project, that suffix is `chromium-linux` when Node's `process.platform` is `linux`. Desktop is 1280×720. Mobile is 390×844. Both use device scale 1. Light means `<html>` has no class `dark`. Dark means the test adds the class `dark` on `<html>` before the shot. The shot is the default screen: storage cleared, `/` loaded, no click. Before each shot the pointer moves to `-1, -1`, so a hover style is not in the picture. Each call uses `fullPage: true`, `animations: "disabled"`, `caret: "hide"`, and `maxDiffPixels: 0`. Playwright's color `threshold` stays at its default, `0.2`. Every test in that file is tagged `@visual`.

4. Given `pnpm e2e:visual` on a developer machine, when screenshots are taken or compared, then the browser is Chromium inside `mcr.microsoft.com/playwright:v1.64.1-noble`. That tag is the official image for `@playwright/test@1.64.1` in `pnpm-lock.yaml`. Given CI, when the `visual` job runs, then `container.image` is that same tag, and the job runs `pnpm build` and then `pnpm exec playwright test --grep @visual` inside the image. It does not install a host copy of Chromium for this suite. `scripts/e2e-visual.sh` is the local command: it starts that image with the repo mounted, passes `--ipc=host`, installs with the pnpm version from `packageManager`, builds, and runs the same Playwright command. The CI job sets the same `--ipc=host` container option. The server is `pnpm start` after that build, inside the image. Playwright's Node process runs in that image too, so `process.platform` is `linux` and the snapshot files match criterion 3. `pnpm e2e` is `playwright test --grep-invert @visual`, so functional tests and the axe page scan stay on the host. A Playwright upgrade changes the image tag in the script and in the workflow in the same commit.

5. Given baselines that need a refresh, when a person updates them, then the command is `pnpm e2e:update-snapshots`. That command is `scripts/e2e-visual.sh` with `--update-snapshots`, in the same image, and it writes the PNG files into the workspace snapshot directory. The image default user is root, which is appropriate for this trusted suite. When the container runs as root, the script gives ownership of any snapshot files it wrote back to the user who invoked the command. Given `AGENTS.md`, when an agent reads the commands, then it says agents never run `pnpm e2e:update-snapshots` and never edit a Playwright `*-snapshots` directory without the owner's approval, and that this is the same rule as approved tests. The Commands section also names `pnpm e2e:visual` and `pnpm e2e:update-snapshots`, and it says `pnpm e2e` runs the axe page scan and skips `@visual`. Given this ticket, when the visual tests first land, then the four Linux baselines are committed in the implementation pull request. Given those baselines already on `main`, when the owner has not approved a change, then an agent does not update them.

6. Given CI, when the end-to-end step or the `visual` job fails, then that job uploads the Playwright HTML report and `test-results/`, including image diffs, with `actions/upload-artifact@v4`, `if: failure()`, and a retention of 14 days. The artifact names are `playwright-report-e2e` and `playwright-report-visual`. The Playwright reporter is `list` plus `html` with `open: "never"`. A green run uploads nothing.

7. Given the Definition of done in `AGENTS.md`, when this ticket is done, then it includes this bullet: "Zero axe violations: no serious or critical axe violation on a key page or on the meal preferences form."

## Edge cases

- Given `/`, when a visual snapshot is taken, then the test has cleared `localStorage`, including `forkcast.preferences`, and `toHaveScreenshot` receives `mask` set to the locator `[data-visual-mask]`. The home page shows no date and no AI output, so that locator matches nothing today. A later date or model output on a key page carries `data-visual-mask` before it is part of a baseline. The visual test sets `locale` to `en-US` and `timezoneId` to `UTC`.

- Given the visual suite, when Chromium paints the page, then the test has awaited `document.fonts.ready`, animations are disabled, the caret is hidden, and the page is served by `pnpm start` after `pnpm build` inside the pinned image. Geist stays the font already loaded by `next/font` in `src/app/layout.tsx`.

## Tests first

This file does not add tests. The implementation ticket writes them first. The axe helper's proof is a nameless button that stays inside the helper's own test and never lands in the product. Show the helper rejecting that button, then commit the test that expects the rejection. Remove nothing from the product, because the button was never added there.

`pnpm check` runs the Vitest files. `pnpm e2e` runs the page axe scan. `pnpm e2e:visual` runs the screenshots. Criteria 4, 5, 6, and 7 are asserted by the scripts, the workflow, and `AGENTS.md` as named below. They do not add a second test runner.

1. Criterion 1 -> three Vitest files.
   - `src/lib/axe-impact.test.ts`: `serious` and `critical` are blocking. `moderate`, `minor`, `null`, and `undefined` are not.
   - `src/test/axe.test.tsx`: render a `<button>` with no accessible name and no text, call `expectNoAxeViolations` on that container, and expect rejection whose message includes the rule id `button-name`. This is the broken fixture from the issue. It is the helper's test, not a product component.
   - `src/components/meal-preferences-form.axe.test.tsx`: clear storage, render `MealPreferencesForm`, wait until "Omnivore" is present, and expect `expectNoAxeViolations` to pass on the render container.
   - The helper's axe options set `color-contrast` to disabled. The page scan in row 2 leaves that rule enabled.

2. Criterion 2 -> `e2e/home.axe.spec.ts`.
   - Read the list from `e2e/key-pages.ts`.
   - For `/`, clear storage, open the page, run `AxeBuilder`, and expect `isBlockingAxeImpact` to be false for every violation.
   - The test file has no `@visual` tag.

3. Criterion 3 -> `e2e/home.visual.spec.ts`.
   - Tag `@visual` on every test in the file.
   - Four `toHaveScreenshot` calls with the names in criterion 3, after the viewport, the `dark` class, and the pointer move to `-1, -1`.
   - The four `*-chromium-linux.png` baselines are committed with the implementation.

4. Criterion 4 -> `package.json`, `scripts/e2e-visual.sh`, and the `visual` job in `.github/workflows/ci.yml`.
   - `e2e` contains `--grep-invert @visual`.
   - `e2e:visual` runs `scripts/e2e-visual.sh`.
   - The script and `container.image` both contain `mcr.microsoft.com/playwright:v1.64.1-noble`.
   - The local script passes `--ipc=host`, and the visual job's container options include `--ipc=host`.
   - The visual job runs `pnpm build` and `pnpm exec playwright test --grep @visual`.

5. Criterion 5 -> `package.json` script `e2e:update-snapshots`, the same shell script with `--update-snapshots`, and the new sentences in `AGENTS.md`.
   - The Commands section names both visual scripts and the approval rule.
   - The first four baselines ship in the implementation pull request. Later edits wait for the owner.

6. Criterion 6 -> `.github/workflows/ci.yml` and `playwright.config.ts`.
   - Reporter is `list` and `html` with `open: "never"`.
   - Each of the two jobs uploads `playwright-report/` and `test-results/` on failure under the artifact names in criterion 6.

7. Criterion 7 -> the Definition of done bullet in `AGENTS.md`, quoted in criterion 7.

8. Dynamic content -> the same `e2e/home.visual.spec.ts` test.
   - It clears `localStorage` before `goto("/")`.
   - It passes `mask: [page.locator("[data-visual-mask]")]`.
   - It sets `locale` `en-US` and `timezoneId` `UTC`.

9. Fonts and animations -> the same visual test and `scripts/e2e-visual.sh`.
   - The test awaits `document.fonts.ready`, moves the pointer to `-1, -1`, and sets `animations: "disabled"` and `caret: "hide"`.
   - The script and the CI job build, then serve with `pnpm start`, inside the pinned image.

## Out of scope

- Storybook. It is planned after v0.1.
- A theme toggle, a plan page, a shopping list, and any route besides `/`.
- An axe scan of `KitchenStatus` or of each shadcn primitive on its own. The form and `/` cover the primitives that are on screen.
- A saved-preferences screenshot, an error-state screenshot, and a Vitest markup snapshot.
- A PreToolUse hook that blocks snapshot edits. The rule lives in `AGENTS.md`.
- The `vitest-axe` package. `docs/tech-stack.md` allows `axe-core` and `@axe-core/playwright`.
- `README.md`, `docs/workflow.md`, and `CLAUDE.md`.
- Generating baselines in the spec pull request.

## Depends on

- Step 1 (skeleton + harness) merged to `main`. It is merged.
- Issue #1, the meal preferences form, merged to `main` in pull request #7. `/` renders `MealPreferencesForm`. `docs/specs/1-meal-preferences-form.md` left pixel placement and the axe scan to this issue.

The implementation adds `axe-core` and `@axe-core/playwright` and edits `AGENTS.md` and `.github/workflows/ci.yml`. That pull request names `risk:high` and does not apply the label. The owner adds `spec:approved` after reviewing this spec, and adds `agent:ready` only when implementation may start. This spec does not add or remove those labels.

## Open questions

The issue does not name viewports, how dark mode is applied, which axe impacts fail, or which container image to pin. The criteria already use the proposed default on each line. To choose a different bar before `spec:approved`, change that criterion and the line together.

1. **Viewports** (criterion 3). Proposed default: desktop 1280×720 and mobile 390×844, both at device scale 1. These are CSS pixels, not a Playwright device preset (those presets add a scale factor and a shorter viewport).
2. **Light and dark** (criterion 3). Proposed default: light is `<html>` without the class `dark`; dark is the test adding that class. Tokens in `src/app/globals.css` switch on `.dark`. The page has no theme control.
3. **Axe impact** (criteria 1, 2, and 7). Proposed default: `serious` and `critical` fail the Vitest helper and the Playwright scan. `moderate`, `minor`, and incomplete results do not. The Vitest helper also disables `color-contrast`, because jsdom does not paint. The Playwright scan of `/` keeps `color-contrast`. The Definition of done sentence means none of those blocking impacts on a key page or on the meal preferences form.
4. **Playwright image** (criterion 4). Proposed default: `mcr.microsoft.com/playwright:v1.64.1-noble`, the tag for `@playwright/test@1.64.1` in `pnpm-lock.yaml`. A later upgrade changes the tag in the same commit. The tag is not `latest`.
5. **Pixel diff** (criterion 3). Proposed default: `maxDiffPixels: 0`, `fullPage: true`, and Playwright's color `threshold` left at its default `0.2`. The pinned image is the only painter. `fullPage` keeps the form below the first viewport in the picture.
