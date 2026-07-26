import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import sitemap from '@/app/sitemap'

// The sitemap and the landing blog strip both hand-maintain route lists.
// A renamed or deleted page directory would leave dead sitemap entries and
// 404ing blog cards undetected — this pins every internal path to a real
// app/<segment>/page.tsx on disk.

function pageFileFor(pathname: string): string {
  const seg = pathname.replace(/^\/+|\/+$/g, '')
  return path.join(process.cwd(), 'app', seg, 'page.tsx')
}

describe('sitemap', () => {
  it('every sitemap URL maps to an existing page', () => {
    for (const { url } of sitemap()) {
      const pathname = new URL(url).pathname
      if (pathname === '/') continue
      expect(fs.existsSync(pageFileFor(pathname)), `${url} has no page.tsx`).toBe(true)
    }
  })
})

describe('blog strip', () => {
  it('every internal blog card href maps to an existing page', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'components/sections/Blog.tsx'), 'utf-8')
    const hrefs = [...src.matchAll(/href: '(\/[^']+)'/g)].map((m) => m[1])
    expect(hrefs.length).toBeGreaterThanOrEqual(10)
    for (const href of hrefs) {
      expect(fs.existsSync(pageFileFor(href)), `${href} has no page.tsx`).toBe(true)
    }
  })
})
