<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tests

These rules are the same in every Altid repo. Only "In this repo" below differs.

The suite is a cost: every test runs on every PR and has to be read and kept. A test earns its place by catching a wrong behaviour nothing else catches. Coverage is not a goal.

- Testing Trophy. Most tests are behaviour tests through the public entry point, with only the outer boundary faked. Unit tests only for pure logic with real branching. A few end-to-end tests for critical journeys.
- Fake the boundary (external services, the network, the clock), never a layer between our own classes. A mocking library is fine at the boundary.
- Every new test maps to an acceptance criterion or a named risk: one concrete wrong behaviour a plausible change would cause, in one line. A test that maps to nothing is not added. A bug fix gets a test that fails on the old code.
- Would a wrong implementation pass? Before handing off, break each behaviour you changed on purpose (flip a condition, drop a branch, return the old value), run the targeted tests, then undo it. A break no test catches is a missing assertion; add it.
- Test shared code once: one table test of the shared thing, one check per caller that it goes through it. No matrices over shared code (every endpoint times every error, every flag times every state).
- Don't test implementation: private helpers, call order no caller sees, framework or library behaviour, generated code, and in UI code position, size, colour, styling or the exact markup tree. Assert what a user sees or what was sent.
- The PR body states the cost: `+N tests, -M tests, +X s`, X being the wall time of the touched test files before and after.
- Never weaken, skip or delete a failing test to get green. Deleting a test that pins implementation is cleanup: name in the commit the behaviour it guarded and the test that still covers it.

### In this repo

- Entry points: route handlers called with a real `NextRequest` (`test/mad-testen-route.test.ts`); pages and components rendered with Testing Library (`test/slet-konto.test.tsx`).
- Boundary fakes: `@supabase/supabase-js` (`test/mad-testen-route.test.ts`), `fetch` and browser APIs via `vi.stubGlobal`, the Amplitude SDK, env vars via `vi.stubEnv`, the clock via `vi.useFakeTimers`. `test/fake-browser.ts` runs the Mad-testen pages' inline handlers against a minimal DOM.
- Run: `npx vitest run test/<subject>.test.ts`; CI (`.github/workflows/test.yml`) runs `npm ci`, `npm test`, `npm run build` on every PR and push to `main`.
