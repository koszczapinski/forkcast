<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forkcast

AI meal planner. The product is not built yet. This file is the short map for Claude Code and Cursor. The process is described in `docs/workflow.md`.

## Commands

- Install: `pnpm install`
- App: `pnpm dev`
- Gate (must pass before a task is done): `pnpm check`
  - `next typegen` (Next.js 16 generates gitignored `next-env.d.ts`)
  - `tsc --noEmit`
  - `eslint .`
  - `vitest run`
- One unit file: `pnpm exec vitest run src/lib/format-servings.test.ts`
- Browser smoke: `pnpm exec playwright install chromium` once, then `pnpm e2e`
- Format: `pnpm format` (not part of the gate)
- Hook self-check: `bash scripts/verify-hooks.sh`

`pnpm check` is the only definition of green. Hooks and CI call that script. Do not invent a second check command.

## Issue lifecycle

Labels are the state machine. Names, colors, and descriptions live in `.github/labels.yml`.

1. A new feature or bug opens with `needs-spec` (and `type:feature` or `type:bug`).
2. The owner approves the spec and adds `spec:approved`.
3. The owner, and only the owner, adds `agent:ready` when an agent may start. `agent:cursor` or `agent:claude` marks which tool.
4. The agent opens a PR. A human merges.

Agents never add or remove `agent:ready`, `spec:approved`, or `risk:*`, and never merge. Do not start implementation unless the owner has set both `spec:approved` and `agent:ready`.

- Bugs use `type:bug` and start with a regression test that fails on `main`.
- `risk:high` means the PR touches the harness (`.claude`, `.cursor`, `.github`, `AGENTS.md`, `CLAUDE.md`), AI prompts, schemas, dependencies, or secrets. Say so in the PR. The owner applies the label.
- `risk:low` is a small, well-tested product change. The owner applies that label too.

## Titles

Issue titles, pull request titles, and commit subjects use `<type>: <summary>`.

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`.

Examples: `feat: Meal preferences form`, `fix: Plan ignores nut allergy`.

The summary is short and imperative, with no trailing period. The pull request title matches the issue title. The pull request body contains `Closes #N`. CI checks the title with `scripts/check-pr-title.mjs` (`PR_TITLE=... node scripts/check-pr-title.mjs`).

## Workflow

- Product work starts from `docs/specs/<issue-number>-<slug>.md`, in the same section order as the issue form (`docs/specs/TEMPLATE.md`). No spec, no code. `/issue` may draft the GitHub issue first, and creates it only after the user confirms.
- Plan first. Wait for a human to approve the plan. Then tests, then code.
- One plan step at a time. No drive-by refactors.
- Tests first: run the new tests and show they fail for the right reason (missing behaviour, not a typo or a bad import).
- After the human approves the tests: commit `test: <ticket>` and create `.claude/tests.lock` (gitignored).
- While that lock exists, approved tests are a contract. Do not edit or weaken them. If a test looks wrong, stop and ask.
- Bug fixes start with a regression test that fails on `main`, then the fix. Same contract after approval.
- Purely visual UI: do not force a unit test. Name the browser check instead.
- Remove `.claude/tests.lock` only at the end of `/pr-ready`, after the reviewer passes.
- A human merges. Agents do not merge.

## Definition of done

- The spec's acceptance criteria are implemented and covered by the approved tests.
- `pnpm check` exits 0. For a user-facing flow, `pnpm e2e` or a named manual check is in the PR.
- The diff does not edit approved test files.
- PR title matches the issue title. The body contains `Closes #N` and the sections Spec, What changed, Evidence, Dlaczego tak, Risk, Out of scope.

## Structure

- `src/app` — App Router routes. Keep pages thin.
- `src/components` — UI. `src/components/ui` is shadcn/ui. Run `pnpm format` after adding a component.
- `src/lib` — pure functions. Prefer these for test-first work.
- `src/test/msw` — MSW server for component tests. Register handlers in the test with `server.use`.
- `e2e` — Playwright. Not part of `pnpm check`.
- `docs/specs` — one spec per ticket.
- `.claude` — hooks, skills (`/issue`, `/spec`, `/tdd`, `/pr-ready`), read-only reviewer. Cursor's `/issue` entry points at the Claude skill.
- `.cursor` — the same gates, adapted to Cursor's hook protocol.
- `.github/labels.yml` — workflow label catalog.

## Conventions

- TypeScript strict. The `@/` alias is `src/`.
- Package manager is pnpm. Do not add an npm or yarn lockfile.
- Test behaviour, not markup snapshots. Colocate unit tests as `*.test.ts` or `*.test.tsx`.
- Component tests use Testing Library and `src/test/msw/server.ts`.
- Named exports for functions and components. Default export only for Next.js pages and layouts.
- No product API, auth, or database in this skeleton. Do not stub a fake backend.

## Gotchas

- Next.js 16 differs from older training data. Read `node_modules/next/dist/docs/` before using an unfamiliar API. Leave the generated block at the top of this file in place.
- `pnpm check` runs `next typegen` before `tsc` because `next-env.d.ts` is not committed.
- The Stop hook runs `pnpm check` only while `.claude/tests.lock` exists. A red suite before approval is expected, so the agent can stop and ask.
- Hooks are bash. They need `bash` on `PATH` (macOS, Linux, or Git Bash) and they read JSON from stdin.
- PreToolUse cannot see every shell redirect. Do not bypass the test lock with a shell command. If you think you must, stop and ask.
- `.env*` is gitignored, and Claude is denied reads of those files. Do not print secrets.
- `cacheComponents` is on in `next.config.ts`. Check the Next.js docs before fetching data in a page.
