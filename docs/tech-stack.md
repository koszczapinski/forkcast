# Approved stack

This is the list of libraries an agent may add. Do not add a dependency that this file does not allow unless the owner explicitly approves that package. Adding one is `risk:high`. The reviewer fails the diff.

Packages already in `package.json` may stay and may be upgraded. A new name has to be in the table below. Do not add a v0.2 or v0.3 package before that version's ticket.

## Choices

| Area | Choice | Packages |
| ---- | ------ | -------- |
| App | Next.js, React | `next`, `react`, `react-dom` (already installed) |
| Forms | React Hook Form, the Zod resolver, and the shadcn `Form` component | `react-hook-form`, `@hookform/resolvers` |
| Validation | Zod. One schema, shared by the UI and the server | `zod` |
| UI | Tailwind, shadcn/ui, lucide-react | `tailwindcss`, `shadcn`, `lucide-react`, plus the shadcn peers already installed (`radix-ui`, `class-variance-authority`, `cn`, `tw-animate-css`) |
| Data | Server Components read. Server Actions write. `useOptimistic` for optimistic UI | No package. `@tanstack/react-query` only when the spec says a client fetch is required |
| AI | Vercel AI SDK, `streamObject` | `ai` |
| DB (v0.2) | Postgres, Drizzle ORM, drizzle-kit migrations | `drizzle-orm`, `drizzle-kit`, and one driver: `pg` or `postgres` |
| Auth (v0.2) | Better Auth | `better-auth` |
| Payments (v0.3) | Stripe, test mode | `stripe` |
| Global state | None by default. Zustand only when the spec shows a need that local state and the server cannot cover | `zustand` |
| Tests | Vitest, React Testing Library, MSW, Playwright, axe | `vitest`, `@testing-library/react`, `msw`, `@playwright/test`, `axe-core`, `@axe-core/playwright` |
| Deploy | Vercel and Neon | No package. Neon is the Postgres host |

The test helpers already in the repo (`@testing-library/dom`, `@testing-library/jest-dom`, `jsdom`) stay with React Testing Library. The gate's toolchain (TypeScript, ESLint, Prettier) stays. A new test or toolchain package is still a new dependency and follows this file.

## Rules that are not packages

- The Zod schema used by the form is the same schema the server action parses. Do not keep a second copy.
- Do not add TanStack Query for a read that a Server Component can do.
- Do not add Zustand, a second form library, a second validator, a second ORM, a second auth library, or a second payment provider.
- shadcn `Form` is the generated component under `src/components/ui`, wired to React Hook Form. It is not a separate npm package.
