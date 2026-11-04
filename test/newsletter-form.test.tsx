import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import NewsletterForm from '@/components/NewsletterForm'

const CONSENT =
  'Jeg vil gerne modtage nyheder, tilbud og anden markedsføring om Altid Mad fra Altid Hjem ApS på e-mail. Jeg kan altid afmelde mig.'

const email = () => screen.getByLabelText('E-mail') as HTMLInputElement
const box = () => screen.getByRole('checkbox', { name: CONSENT }) as HTMLInputElement
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Tilmeld' }))

function answer(status: number) {
  return Promise.resolve(new Response(JSON.stringify({}), { status }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NewsletterForm', () => {
  it('shows ALT-895’s copy, one e-mail field and an unticked box', () => {
    render(<NewsletterForm />)
    expect(screen.getByRole('heading', { name: 'Få nyheder fra Altid Mad' })).toBeInTheDocument()
    expect(email()).toHaveAttribute('autocomplete', 'email')
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(box().checked).toBe(false)
  })

  it('posts the newsletter body and replaces itself with the success line, which takes focus', async () => {
    const fetchStub = vi.fn(() => answer(200))
    vi.stubGlobal('fetch', fetchStub)
    render(<NewsletterForm />)
    fireEvent.change(email(), { target: { value: ' ny@example.dk ' } })
    fireEvent.click(box())
    submit()

    const success = await screen.findByText('Tak. Du hører fra os.')
    await waitFor(() => expect(success).toHaveFocus())
    expect(screen.queryByRole('button')).toBeNull()
    expect(fetchStub).toHaveBeenCalledTimes(1)
    const [url, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/waitlist')
    expect(JSON.parse(init.body as string)).toEqual({ source: 'newsletter', scope: 'mad', email: 'ny@example.dk', consent: true })
  })

  it('unticked: focuses the box with an inline error and posts nothing', () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)
    render(<NewsletterForm />)
    fireEvent.change(email(), { target: { value: 'ny@example.dk' } })
    submit()
    expect(screen.getByText('Sæt kryds i feltet for at tilmelde dig.')).toBeInTheDocument()
    expect(box()).toHaveFocus()
    expect(box()).toHaveAttribute('aria-invalid', 'true')
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('invalid address: focuses the field with an inline error and posts nothing', () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)
    render(<NewsletterForm />)
    fireEvent.change(email(), { target: { value: 'ikke-en-adresse' } })
    fireEvent.click(box())
    submit()
    expect(screen.getByText('Skriv en gyldig e-mailadresse.')).toBeInTheDocument()
    expect(email()).toHaveFocus()
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('disables the button and says "Tilmelder…" while in flight, so a double tap sends once', async () => {
    let release: (r: Response) => void = () => {}
    const fetchStub = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)))
    vi.stubGlobal('fetch', fetchStub)
    render(<NewsletterForm />)
    fireEvent.change(email(), { target: { value: 'ny@example.dk' } })
    fireEvent.click(box())
    submit()
    const busy = await screen.findByRole('button', { name: 'Tilmelder…' })
    expect(busy).toBeDisabled()
    fireEvent.click(busy)
    expect(fetchStub).toHaveBeenCalledTimes(1)
    release(new Response('{}', { status: 200 }))
    await screen.findByText('Tak. Du hører fra os.')
  })

  it.each([
    ['429', () => answer(429), 'For mange forsøg. Prøv igen om en time.'],
    ['503', () => answer(503), 'Vi kunne ikke tilmelde dig lige nu. Prøv igen om et øjeblik.'],
    ['a 500', () => answer(500), 'Vi kunne ikke tilmelde dig lige nu. Prøv igen om et øjeblik.'],
    ['a network failure', () => Promise.reject(new TypeError('offline')), 'Noget gik galt. Tjek din forbindelse, og prøv igen.'],
  ])('%s keeps the input, says retry and can be sent again', async (_name, reply, message) => {
    vi.stubGlobal('fetch', vi.fn(reply))
    render(<NewsletterForm />)
    fireEvent.change(email(), { target: { value: 'ny@example.dk' } })
    fireEvent.click(box())
    submit()
    const status = await screen.findByText(message)
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(email().value).toBe('ny@example.dk')
    expect(box().checked).toBe(true)
    const button = screen.getByRole('button', { name: 'Tilmeld' })
    expect(button).toBeEnabled()
    // Disabling it in flight dropped focus to the page.
    await waitFor(() => expect(button).toHaveFocus())
  })
})
