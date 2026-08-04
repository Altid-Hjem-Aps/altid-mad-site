import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'

// The confirm page's states and its server action, exercised with REAL signed
// tokens (only the DB and Next plumbing are mocked). This is where the 4 Aug
// incident's fix is pinned end to end: every replay path must land on an
// honest screen, and every cookie delete must carry the /bekraeft path — a
// bare cookies().delete(name) emits Path=/ and silently no-ops against the
// Path=/bekraeft cookie.

// Set BEFORE any signConfirmToken call (secret() reads lazily per call).
process.env.CONSENT_TOKEN_SECRET = 'test-secret-for-bekraeft-page'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'

// A minimal cookie jar the mocked next/headers hands to page and action alike.
type Jar = {
  get: (name: string) => { value: string } | undefined
  delete: ReturnType<typeof vi.fn>
}
let jar: Jar
function setJar(token?: string) {
  jar = {
    get: (name: string) => (token && name === 'am_confirm' ? { value: token } : undefined),
    delete: vi.fn(),
  }
}

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(jar),
}))
// redirect throws in production too (NEXT_REDIRECT) — mirror that so action
// control flow stays realistic and assertable.
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))
vi.mock('@/lib/db', () => ({
  redeemConsentToken: vi.fn(),
  isConfirmTokenRedeemed: vi.fn(),
}))
vi.mock('@/lib/amplitude.server', () => ({
  trackServer: vi.fn(),
  flushAmplitude: vi.fn(() => ({ promise: Promise.resolve() })),
}))
// after() would need a real request scope; the flush it schedules is not what
// these tests pin, so record without executing.
vi.mock('next/server', () => ({ after: vi.fn() }))

import BekraeftPage from '@/app/bekraeft/page'
import ConsentConfirmForm from '@/components/ConsentConfirmForm'
import { redeemConsentToken, isConfirmTokenRedeemed } from '@/lib/db'
import { trackServer } from '@/lib/amplitude.server'
import { signConfirmToken, tokenId } from '@/lib/consent-token'
import {
  CONFIRM_DONE_HEADING,
  CONFIRM_ALREADY_HEADING,
  CONFIRM_EXPIRED_HEADING,
  CONFIRM_PAGE_HEADING,
  CONFIRM_PICK_ONE,
  CONFIRM_HOME_CTA,
} from '@/lib/copy'

const PUBLIC_ID = '08a3b8b6-9482-4ff1-9703-220331a068dd'
const NOW = Date.now() / 1000

async function renderPage(state?: string) {
  const ui = await BekraeftPage({ searchParams: Promise.resolve({ state }) })
  render(ui)
  return ui
}

// The action is an unexported closure; the page hands it to the form as a
// prop, so pull it off the element tree the page returned.
function extractAction(ui: ReactElement): (fd: FormData) => Promise<void> {
  const queue: unknown[] = [ui]
  while (queue.length) {
    const node = queue.shift() as ReactElement | null
    if (!node || typeof node !== 'object') continue
    if (node.type === ConsentConfirmForm) {
      return (node.props as { action: (fd: FormData) => Promise<void> }).action
    }
    const children = (node.props as { children?: unknown })?.children
    if (Array.isArray(children)) queue.push(...children)
    else if (children) queue.push(children)
  }
  throw new Error('ConsentConfirmForm not found in page tree')
}

function formData(...consents: string[]) {
  const fd = new FormData()
  for (const c of consents) fd.append('consent', c)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isConfirmTokenRedeemed).mockResolvedValue(false)
})

describe('/bekraeft rendering states', () => {
  it('state=done shows the thank-you screen WITH a home CTA (no more dead end)', async () => {
    setJar()
    await renderPage('done')
    expect(screen.getByRole('heading', { name: CONFIRM_DONE_HEADING })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: CONFIRM_HOME_CTA })).toHaveAttribute('href', '/')
  })

  it('state=already shows the honest replay screen', async () => {
    setJar()
    await renderPage('already')
    expect(screen.getByRole('heading', { name: CONFIRM_ALREADY_HEADING })).toBeInTheDocument()
  })

  it('no cookie shows the expired screen', async () => {
    setJar()
    await renderPage()
    expect(screen.getByRole('heading', { name: CONFIRM_EXPIRED_HEADING })).toBeInTheDocument()
  })

  it('valid cookie renders the form', async () => {
    setJar(signConfirmToken(PUBLIC_ID, { mad: true, group: false }, NOW))
    await renderPage()
    expect(screen.getByRole('heading', { name: CONFIRM_PAGE_HEADING })).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('valid cookie whose token is already redeemed renders the replay screen, not the form', async () => {
    const token = signConfirmToken(PUBLIC_ID, { mad: true, group: false }, NOW)
    setJar(token)
    vi.mocked(isConfirmTokenRedeemed).mockResolvedValue(true)
    await renderPage()
    expect(screen.getByRole('heading', { name: CONFIRM_ALREADY_HEADING })).toBeInTheDocument()
    expect(vi.mocked(isConfirmTokenRedeemed)).toHaveBeenCalledWith(tokenId(token))
  })

  it('falls OPEN to the form when the redeemed-check errors (enforcement lives in the RPC)', async () => {
    setJar(signConfirmToken(PUBLIC_ID, { mad: true, group: false }, NOW))
    vi.mocked(isConfirmTokenRedeemed).mockRejectedValue(new Error('supabase down'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderPage()
    expect(screen.getByRole('heading', { name: CONFIRM_PAGE_HEADING })).toBeInTheDocument()
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/falling open/), expect.any(Error))
    log.mockRestore()
  })

  it('state=pick with a valid cookie renders the form with the inline error', async () => {
    setJar(signConfirmToken(PUBLIC_ID, { mad: true, group: false }, NOW))
    await renderPage('pick')
    expect(screen.getByRole('alert')).toHaveTextContent(CONFIRM_PICK_ONE)
  })

  it('state=expired never re-reads the cookie into a form', async () => {
    setJar(signConfirmToken(PUBLIC_ID, { mad: true, group: false }, NOW))
    await renderPage('expired')
    expect(screen.getByRole('heading', { name: CONFIRM_EXPIRED_HEADING })).toBeInTheDocument()
  })
})

describe('confirmAction outcomes', () => {
  async function actionWithToken(token?: string) {
    setJar(token ?? signConfirmToken(PUBLIC_ID, { mad: true, group: true }, NOW))
    const ui = await BekraeftPage({ searchParams: Promise.resolve({}) })
    return extractAction(ui)
  }

  it('applied → state=done, cookie kept so replays stay honest', async () => {
    const action = await actionWithToken()
    vi.mocked(redeemConsentToken).mockResolvedValue('applied')

    await expect(action(formData('mad', 'group'))).rejects.toThrow('NEXT_REDIRECT:/bekraeft?state=done')

    expect(vi.mocked(redeemConsentToken)).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: PUBLIC_ID, mad: true, group: true }),
    )
    expect(jar.delete).not.toHaveBeenCalled()
    // The funnel event carries the id and the granted set — renaming or
    // dropping it silently is exactly what made this flow unmeasurable before.
    expect(vi.mocked(trackServer)).toHaveBeenCalledWith(
      'Consent Confirmed',
      expect.objectContaining({ signup_id: PUBLIC_ID, mad: true, group: true }),
      PUBLIC_ID,
    )
  })

  it('already_used → state=already (the exact 4 Aug double-click path)', async () => {
    const action = await actionWithToken()
    vi.mocked(redeemConsentToken).mockResolvedValue('already_used')
    await expect(action(formData('mad'))).rejects.toThrow('NEXT_REDIRECT:/bekraeft?state=already')
    expect(jar.delete).not.toHaveBeenCalled()
  })

  it('ineligible → state=expired and the cookie is deleted WITH the /bekraeft path', async () => {
    const action = await actionWithToken()
    vi.mocked(redeemConsentToken).mockResolvedValue('ineligible')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(action(formData('mad'))).rejects.toThrow('NEXT_REDIRECT:/bekraeft?state=expired')
    expect(jar.delete).toHaveBeenCalledWith({ name: 'am_confirm', path: '/bekraeft' })
    // ONE delete only: the response-cookie jar keys by name, so a second
    // same-name delete would clobber this one (the 4 Aug route regression).
    expect(vi.mocked(jar.delete).mock.calls).toHaveLength(1)
    // Data minimisation: the analytics event must NOT carry the signup id for
    // someone who may have left the list — the server log carries it instead.
    expect(vi.mocked(trackServer)).toHaveBeenCalledWith('Consent Confirm Ineligible', {})
    expect(log).toHaveBeenCalledWith(expect.stringContaining(PUBLIC_ID))
    log.mockRestore()
  })

  it('unticked everything → state=pick, nothing redeemed, cookie kept', async () => {
    const action = await actionWithToken()
    await expect(action(formData())).rejects.toThrow('NEXT_REDIRECT:/bekraeft?state=pick')
    expect(vi.mocked(redeemConsentToken)).not.toHaveBeenCalled()
    expect(jar.delete).not.toHaveBeenCalled()
  })

  it('form ticks can only NARROW the token set, never widen it', async () => {
    // Token vouches for mad only; a tampered form submitting group too must
    // not redeem group.
    const action = await actionWithToken(signConfirmToken(PUBLIC_ID, { mad: true, group: false }, NOW))
    vi.mocked(redeemConsentToken).mockResolvedValue('applied')
    await expect(action(formData('mad', 'group'))).rejects.toThrow('state=done')
    expect(vi.mocked(redeemConsentToken)).toHaveBeenCalledWith(
      expect.objectContaining({ mad: true, group: false }),
    )
  })

  it('no cookie at POST time → state=expired with a path-scoped delete', async () => {
    const action = await actionWithToken()
    setJar(undefined) // cookie vanished between render and POST
    await expect(action(formData('mad'))).rejects.toThrow('NEXT_REDIRECT:/bekraeft?state=expired')
    expect(jar.delete).toHaveBeenCalledWith({ name: 'am_confirm', path: '/bekraeft' })
  })

  it('an RPC failure surfaces as an error, never as a state screen', async () => {
    const action = await actionWithToken()
    vi.mocked(redeemConsentToken).mockRejectedValue(new Error('connection reset'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(action(formData('mad'))).rejects.toThrow('connection reset')
    expect(log).toHaveBeenCalledWith(expect.stringContaining(PUBLIC_ID), expect.any(Error))
    log.mockRestore()
  })
})
