import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Privatlivspolitik from '@/app/privatlivspolitik/page'

vi.mock('@/components/Nav', () => ({ default: () => null }))

const POLICY_URL = 'https://www.altidhjem.dk/privatlivspolitik.json'

const policy = {
  updated: '2026-11-03',
  sections: [
    {
      title: '1. Vi er den dataansvarlige',
      blocks: [{ type: 'paragraph', text: 'Skriv til [fixture@altidhjem.dk](mailto:fixture@altidhjem.dk) om fixture-ansvar.' }],
    },
    {
      title: '2. Deling af oplysninger',
      blocks: [
        { type: 'label', text: 'Fixture-databehandlere' },
        { type: 'list', items: [{ label: 'Fixture-leverandør', text: 'Hoster fixture-data.' }] },
      ],
    },
    {
      title: '3. Cookies',
      blocks: [
        { type: 'paragraph', text: 'Fixture-cookietekst fra altidhjem.dk.' },
        { type: 'label', text: 'Nødvendige (kræver ikke samtykke)' },
        { type: 'list', items: [{ label: 'norlys_auth', text: 'Kun på altidhjem.dk.' }] },
      ],
    },
  ],
}

function stubFetch(body: unknown, init?: { ok?: boolean; status?: number }) {
  const fetchMock = vi.fn(async () => ({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('/privatlivspolitik', () => {
  it('shows the policy fetched from altidhjem.dk, not a copy of its own', async () => {
    const fetchMock = stubFetch(policy)
    render(await Privatlivspolitik())
    expect(fetchMock).toHaveBeenCalledWith(POLICY_URL, expect.anything())
    const h2s = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2s).toEqual(['1. Vi er den dataansvarlige', '2. Deling af oplysninger', '3. Cookies'])
    expect(screen.getByText(/om fixture-ansvar/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'fixture@altidhjem.dk' })).toHaveAttribute('href', 'mailto:fixture@altidhjem.dk')
    expect(screen.getByText('Fixture-databehandlere')).toBeInTheDocument()
    expect(screen.getByText(/Hoster fixture-data/)).toBeInTheDocument()
    expect(screen.getByText('Senest opdateret: 3. november 2026')).toBeInTheDocument()
  })

  it('keeps this site\'s own cookie list and settings button instead of the fetched cookie text', async () => {
    stubFetch(policy)
    render(await Privatlivspolitik())
    const section = document.getElementById('cookies') as HTMLElement
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent('3. Cookies')
    for (const name of ['ah-cookie-consent:', 'am_confirm:', 'ah-waitlist-joined:', 'ah-exit-intent-shown:', 'AMP_* (Amplitude):']) {
      expect(section).toHaveTextContent(name)
    }
    expect(section).toHaveTextContent('se afsnit 2.')
    expect(section).not.toHaveTextContent('norlys_auth')
    expect(section).not.toHaveTextContent('Fixture-cookietekst')
    expect(within(section).getByRole('button', { name: 'Cookieindstillinger' })).toBeInTheDocument()
  })

  it('fails instead of rendering a partial policy when the fetch or the shape is wrong', async () => {
    stubFetch({}, { ok: false, status: 503 })
    await expect(Privatlivspolitik()).rejects.toThrow('503')

    stubFetch({ ...policy, sections: [{ title: '1. Ny', blocks: [{ type: 'table', rows: [] }] }, ...policy.sections] })
    await expect(Privatlivspolitik()).rejects.toThrow('unknown shape')
  })
})
