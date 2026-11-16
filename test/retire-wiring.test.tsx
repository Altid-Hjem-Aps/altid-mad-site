// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { retiredDestination } from '@/lib/retire'

// What the retirement switch (lib/retire.ts) must leave working: the layout's exit pop-up goes,
// and every file a sent mail loads from this domain keeps being served here.

vi.mock('next/font/google', () => ({ Onest: () => ({ variable: "f", className: "f" }), Afacad: () => ({ variable: "f", className: "f" }), }))
vi.mock('@/components/ExitIntentModal', () => ({ default: () => <div data-exit-intent="" /> }))
vi.mock('@/components/CookieBanner', () => ({ default: () => null }))
vi.mock('@/components/ResetScrollOnLoad', () => ({ default: () => null }))

const ORIGINAL = process.env.SITE_RETIRED
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SITE_RETIRED
  else process.env.SITE_RETIRED = ORIGINAL
})

describe('layout', () => {
  it.each([
    ['1', false],
    [undefined, true],
  ])('with SITE_RETIRED=%s renders the exit pop-up: %s', async (flag, shown) => {
    if (flag === undefined) delete process.env.SITE_RETIRED
    else process.env.SITE_RETIRED = flag
    vi.resetModules()
    const { default: RootLayout } = await import('@/app/layout')
    expect(renderToStaticMarkup(<RootLayout><p /></RootLayout>).includes('data-exit-intent')).toBe(shown)
  })
})

describe('files sent mails load from this domain', () => {
  it('are all kept while retired', () => {
    const dirs = ['emails', 'lib'].filter((d) => fs.existsSync(d))
    const files = dirs.flatMap((d) => fs.readdirSync(d).map((f) => path.join(d, f))).filter((f) => fs.statSync(f).isFile())
    const urls = new Set<string>()
    for (const f of files) for (const [u] of fs.readFileSync(f, 'utf8').matchAll(/https:\/\/altidmad\.dk\/[^"'\s)`?]+\.[a-z0-9]+/gi)) urls.add(u)
    expect(urls.size).toBeGreaterThan(0)
    for (const u of urls) expect(retiredDestination(new URL(u).pathname, ''), u).toBeNull()
  })
})
