# Testing

What to test, and what not to, is the Tests section in `AGENTS.md`. This file covers the mechanics.

## Framework

- **vitest** (jsdom environment) + **@testing-library/react**
- Config: `vitest.config.ts` (globals on, `@/` alias matches tsconfig)
- Setup: `test/setup.ts` loads `@testing-library/jest-dom/vitest` matchers

## Running tests

```bash
npm test               # full suite (vitest run)
npx vitest             # watch mode
npm run test:coverage  # coverage report (@vitest/coverage-v8)
```

CI runs the full suite on every PR and on pushes to `main`
(`.github/workflows/test.yml`: `npm ci` → `npm test` → `npm run build`).
A PR can't merge green with failing tests or a broken build.

## Test layers

- **Unit tests** — pure functions in `lib/` (e.g. `test/survey-token.test.ts`).
- **Component/page tests** — render App Router pages and components with Testing Library (e.g. `test/slet-konto.test.tsx`). Mock client components with browser-only side effects (Nav, Amplitude).
- **Smoke/E2E** — not set up yet; the dev-server + Playwright screenshot flow is run manually via /verify or /design-review.

## Conventions

- Files live in `test/`, named `<subject>.test.ts(x)`.
- Import `describe`/`it`/`expect` explicitly from `vitest` (the convention here). `globals: true` in vitest.config.ts exists only so @testing-library/react auto-cleanup works — don't rely on globals in test code.
- Query by role/accessible name first (`getByRole('heading', { name: ... })`), text second.
- Test what code DOES — no `expect(x).toBeDefined()` filler.
- Server-only env vars: use `vi.stubEnv(...)` in `beforeAll` and `vi.unstubAllEnvs()` in `afterAll` (see survey-token test). Never assign to `process.env` directly — it leaks between test files if isolation is ever disabled.
- Never import real secrets in tests.
