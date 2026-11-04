import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

// The standing guard for ALT-895: no waitlist wording may come back in the site's
// source. Scans every .ts and .tsx file under app/, components/ and lib/, plus the
// consent-confirm mail. Comments count, so the words cannot linger as a to-do.
const WORDING = /venteliste|ventelist|waitlist|skriv dig op|skrevet op|kommer snart|snart|plads i køen|frem i køen|når vi åbner/i

// Every file allowed to match, and why. Keep this list short.
const ALLOWED: Record<string, string> = {
  'app/api/waitlist/route.ts': 'the route keeps its URL; steps 1 and 2 answer pages cached before the flip',
  'app/api/mad-testen/route.ts': 'Mad-testen pages stay as they are',
  'lib/mad-test.ts': 'Mad-testen pages stay as they are',
  'app/privatlivspolitik/page.tsx': 'legal text describing the people still on the list; Alex decides',
  'components/NewsletterForm.tsx': 'posts to /api/waitlist, the route the handler lives on',
  'lib/api.ts': 'server calls to the upstream waitlist API for steps 1 and 2',
  'lib/resend.ts': 'server only, not rendered',
  'lib/send-email.ts': 'server only: template ids of mails to the existing list',
  'lib/send-sms.ts': 'server only: the SMS for step 1',
  'lib/signup-source.ts': 'a log line for the step 1 path',
}

const ROOT = process.cwd()

function sources(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name)
    if (entry.isDirectory()) return sources(rel)
    return /\.tsx?$/.test(entry.name) ? [rel] : []
  })
}

const files = [...sources('app'), ...sources('components'), ...sources('lib'), 'emails/consent-confirm.ts']

// Thor's rule: no em or en dashes in copy. Reads strings and JSX text through the
// TypeScript parser, so code comments stay free and a dash in a page, a title, an
// aria-label or a JSON-LD answer fails here.
const DASH = /[–—]|&[nm]dash;|&#821[12];|&#x201[34];/i

// Out of scope for the rule: legal text, and Mad-testen, which has its own check.
const DASH_OUT_OF_SCOPE = /^(app\/privatlivspolitik\/|app\/mad-testen|app\/api\/mad-test|lib\/mad-test)/

// Each entry: why it may keep a dash. None of these reach a visitor.
const DASH_ALLOWED: Record<string, string> = {
  'app/api/bekraeft/route.ts': 'a server log line',
  'app/api/waitlist/route.ts': 'a server log line',
}

function dashedCopy(source: string): string[] {
  const file = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const hits: string[] = []
  const visit = (node: ts.Node) => {
    const text = ts.isJsxText(node)
      ? node.getText()
      : ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)
        ? node.text
        : null
    if (text !== null && DASH.test(text)) hits.push(text.trim())
    ts.forEachChild(node, visit)
  }
  visit(file)
  return hits
}

describe('no waitlist wording', () => {
  it('scans the whole site', () => {
    expect(files).toContain('components/Hero.tsx')
    expect(files).toContain('app/madbudget/page.tsx')
    expect(files).toContain('lib/copy.ts')
  })

  it('appears only in the allowed files', () => {
    const hits = files.filter((f) => !(f in ALLOWED) && WORDING.test(fs.readFileSync(path.join(ROOT, f), 'utf-8')))
    expect(hits).toEqual([])
  })

  it('keeps no stale entry in the allowlist', () => {
    const stale = Object.keys(ALLOWED).filter((f) => !WORDING.test(fs.readFileSync(path.join(ROOT, f), 'utf-8')))
    expect(stale).toEqual([])
  })

  it('leaves no #hent-appen link without a target: every page with a store CTA has the anchor', () => {
    const pages = files.filter((f) => /^app\/.+\/page\.tsx$/.test(f))
    for (const page of pages) {
      const src = fs.readFileSync(path.join(ROOT, page), 'utf-8')
      if (/<BottomCta|<MidCta|#\$\{STORE_ANCHOR\}/.test(src)) expect(src, page).toContain('id={STORE_ANCHOR}')
    }
  })
})

const dashFiles = [...sources('app'), ...sources('components'), ...sources('lib')].filter((file) => !DASH_OUT_OF_SCOPE.test(file))
const readSource = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf-8')

describe('dash guard', () => {
  it('reads strings and JSX text, not comments', () => {
    const source = `
      // en kommentar — fri
      const a = 'med – streg'
      const b = <p aria-label="x — y">tekst — her</p>
      const c = <p>&ndash;</p>
      const d = 'ren, med-bindestreg'
    `
    expect(dashedCopy(source)).toEqual(['med – streg', 'x — y', 'tekst — her', '&ndash;'])
  })

  it('finds none outside the allowlist', () => {
    const hits = dashFiles
      .filter((file) => !(file in DASH_ALLOWED))
      .flatMap((file) => dashedCopy(readSource(file)).map((text) => `${file}: ${text.slice(0, 80)}`))
    expect(hits).toEqual([])
  })

  it('keeps no stale entry in its allowlist', () => {
    const stale = Object.keys(DASH_ALLOWED).filter((file) => dashedCopy(readSource(file)).length === 0)
    expect(stale).toEqual([])
  })
})
