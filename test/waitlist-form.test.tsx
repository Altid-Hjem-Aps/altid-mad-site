import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import WaitlistForm from '@/components/WaitlistForm'
import {
  CONSENT_VERSION,
  SIGNUP_CONSENT_ALL,
  SIGNUP_CONSENT_MAD,
  SIGNUP_CONSENT_GROUP,
  SIGNUP_LAUNCH_NOTICE,
  SIGNUP_CONSENT_WITHDRAW,
  SIGNUP_CONSENT_NARROW_LINK,
  SIGNUP_CONSENT_BROAD_LINK,
  SIGNUP_CONSENT_SENDERS_LINK,
  SIGNUP_CONSENT_SENDERS,
  DUPLICATE_SIGNUP_HEADING,
  CONFIRM_SENT_HEADING,
  confirmSentBody,
  ALREADY_CONSENTED_HEADING,
} from '@/lib/copy'

// Amplitude is a browser SDK with network side effects — mock it.
vi.mock('@amplitude/analytics-browser', () => ({ track: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function fillAndSubmitDark() {
  render(<WaitlistForm variant="dark" />)
  fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
  fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
  fireEvent.change(screen.getByPlaceholderText('12 34 56 78'), { target: { value: '12345678' } })
  fireEvent.click(screen.getByRole('checkbox')) // tick the consent box
  fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
}

describe('WaitlistForm embedded mode (exit-intent dialog)', () => {
  it('hides its own heading and still tags the signup source in the POST body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<WaitlistForm variant="dark" source="exit-intent" embedded />)
    expect(screen.queryByText('Skriv dig gratis på ventelisten')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
    fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
    fireEvent.change(screen.getByPlaceholderText('12 34 56 78'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('checkbox')) // tick the consent box
    fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).source).toBe('exit-intent')
  })

  it('non-embedded default keeps its standalone heading', () => {
    render(<WaitlistForm variant="dark" />)
    expect(screen.getByText('Skriv dig gratis på ventelisten')).toBeInTheDocument()
  })
})

describe('waitlist-joined flag (exit-popup suppression)', () => {
  it('marks the browser on a successful signup', async () => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(window.localStorage.getItem('ah-waitlist-joined')).toBe('1'))
  })

  it('marks the browser when the API says the signup already exists (409)', async () => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ success: false, error: 'Du er allerede skrevet op!' }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(window.localStorage.getItem('ah-waitlist-joined')).toBe('1'))
  })

  it('still shows the plain duplicate card when nothing was ticked', async () => {
    // Unchanged behaviour: no consent asked for, nothing to confirm, so the
    // reader is simply told they are already on the list.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Du er allerede skrevet op til Altid Hjem.',
            inviteUrl: 'https://altidmad.dk/?ref=abc',
          }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText(DUPLICATE_SIGNUP_HEADING)).toBeInTheDocument())
    expect(screen.queryByText(CONFIRM_SENT_HEADING)).toBeNull()
  })

  it('sends them to their inbox instead of the dead end when consent is pending', async () => {
    // The fix. The ticked boxes are held pending and a confirmation mail is sent,
    // so the screen must NOT say "du er allerede skrevet op" — that sentence read
    // as "you're covered" and is what lost 36 people's consent on 14 Jul.
    const body = confirmSentBody('test@test.dk')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            success: false,
            confirmSent: true,
            heading: CONFIRM_SENT_HEADING,
            error: body,
          }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText(CONFIRM_SENT_HEADING)).toBeInTheDocument())
    expect(screen.getByText(body)).toBeInTheDocument()
    expect(screen.queryByText(DUPLICATE_SIGNUP_HEADING)).toBeNull()
    // No referral push while a confirmation is pending — it would bury the one
    // action we actually need from them.
    expect(screen.queryByRole('button', { name: /kopiér/i })).toBeNull()
  })

  it('tells someone who already holds the consent that there is nothing to do', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            success: false,
            alreadyConsented: true,
            heading: ALREADY_CONSENTED_HEADING,
            error: 'Du står på ventelisten og vil modtage nyt om Altid Mad. Du behøver ikke gøre mere.',
            inviteUrl: 'https://altidmad.dk/?ref=abc',
          }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText(ALREADY_CONSENTED_HEADING)).toBeInTheDocument())
    expect(screen.queryByText(CONFIRM_SENT_HEADING)).toBeNull()
  })

  it('does NOT mark the browser on other failures', async () => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText(/prøv igen/i)).toBeInTheDocument())
    expect(window.localStorage.getItem('ah-waitlist-joined')).toBeNull()
  })
})

describe('WaitlistForm step 1 failure paths', () => {
  it('shows an error and re-enables the button when fetch rejects (offline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText(/prøv igen/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /skriv mig på ventelisten/i })).toBeEnabled()
  })

  it('surfaces the API error message on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Ugyldigt telefonnummer' }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText('Ugyldigt telefonnummer')).toBeInTheDocument())
  })

  it('moves to the questions step on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText('Fortæl os lidt om dig.')).toBeInTheDocument())
  })
})

describe('duplicate signup with recovered referral link (409 + inviteUrl)', () => {
  it('shows the share card with their invite link instead of a dead-end error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Du er allerede skrevet op!',
            inviteUrl: 'https://altidmad.dk/?ref=abc-123',
          }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText('Du er allerede skrevet op!')).toBeInTheDocument())
    expect(screen.getByDisplayValue('https://altidmad.dk/?ref=abc-123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kopiér' })).toBeInTheDocument()
  })

  it('uses the longer Hjem message as the card body when the API sends it', async () => {
    const hjemMsg = 'Du er allerede skrevet op til Altid Hjem.'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ success: false, error: hjemMsg, inviteUrl: 'https://altidmad.dk/?ref=xyz' }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText('Du er allerede skrevet op!')).toBeInTheDocument())
    expect(screen.getByText(hjemMsg)).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://altidmad.dk/?ref=xyz')).toBeInTheDocument()
  })

  it('keeps the plain error text when the API has no invite link for them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ success: false, error: 'Du er allerede skrevet op!' }),
      }),
    )
    fillAndSubmitDark()
    await waitFor(() => expect(screen.getByText('Du er allerede skrevet op!')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Kopiér' })).toBeNull()
  })
})

describe('consent copy: one sentence, opt-down to Altid Mad only', () => {
  function typeName() {
    render(<WaitlistForm variant="dark" />)
    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
  }

  it('shows the broad (every brand) sentence by default, not the narrow one', () => {
    typeName()
    expect(screen.getByText(SIGNUP_CONSENT_ALL)).toBeVisible()
    expect(screen.queryByText(SIGNUP_CONSENT_MAD)).toBeNull()
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })

  it('is never pre-ticked, regardless of which sentence is showing', () => {
    typeName()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_NARROW_LINK }))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('swaps to the narrow (Altid Mad-only) sentence when the link is clicked, and back again', () => {
    typeName()
    fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_NARROW_LINK }))
    expect(screen.getByText(SIGNUP_CONSENT_MAD)).toBeVisible()
    expect(screen.queryByText(SIGNUP_CONSENT_ALL)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_BROAD_LINK }))
    expect(screen.getByText(SIGNUP_CONSENT_ALL)).toBeVisible()
    expect(screen.queryByText(SIGNUP_CONSENT_MAD)).toBeNull()
  })

  it('clears an existing tick when the scope link is toggled, since the person ticked a sentence they can no longer see', () => {
    typeName()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_NARROW_LINK }))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('names its withdraw sentence via aria-describedby, so the box has an accessible description', () => {
    typeName()
    const checkbox = screen.getByRole('checkbox')
    const describedById = checkbox.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()
    expect(document.getElementById(describedById!)).toHaveTextContent(SIGNUP_CONSENT_WITHDRAW)
  })

  it('names every brand in the broad sentence, and keeps the narrow sentence to Altid Mad alone', () => {
    for (const brand of ['Altid Hjem', 'Altid Forsikring', 'Altid Energi', 'Altid Mobil', 'Altid Mad']) {
      expect(SIGNUP_CONSENT_ALL).toContain(brand)
    }
    expect(SIGNUP_CONSENT_MAD).toContain('Altid Mad')
    for (const brand of ['Energi', 'Mobil', 'Forsikring']) {
      expect(SIGNUP_CONSENT_MAD).not.toContain(brand)
    }
  })

  it('opens the list of companies behind the senders from "Hvem står bag?", and closes it again', () => {
    typeName()
    const link = screen.getByRole('button', { name: SIGNUP_CONSENT_SENDERS_LINK })
    expect(link).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(SIGNUP_CONSENT_SENDERS[0])).toBeNull()

    fireEvent.click(link)
    expect(link).toHaveAttribute('aria-expanded', 'true')
    for (const line of SIGNUP_CONSENT_SENDERS) expect(screen.getByText(line)).toBeVisible()
    expect(screen.getByRole('checkbox')).not.toBeChecked()

    fireEvent.click(link)
    expect(screen.queryByText(SIGNUP_CONSENT_SENDERS[0])).toBeNull()
  })

  it('hides "Hvem står bag?" on the narrow sentence, which has a single sender', () => {
    typeName()
    fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_SENDERS_LINK }))
    fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_NARROW_LINK }))
    expect(screen.queryByRole('button', { name: SIGNUP_CONSENT_SENDERS_LINK })).toBeNull()
    expect(screen.queryByText(SIGNUP_CONSENT_SENDERS[0])).toBeNull()
  })

  it('versions the new wording, since consent_version records the text accepted', () => {
    expect(CONSENT_VERSION).toBe('2026-10-16.1-mad')
  })

  it('keeps the group sentence for the confirm mail and preference centre, still naming lanceringer', () => {
    expect(SIGNUP_CONSENT_MAD).not.toContain('lanceringer')
    expect(SIGNUP_CONSENT_GROUP).toContain('lanceringer')
  })

  it('shows the signup-grounded launch notice once the visitor starts typing', () => {
    typeName()
    expect(screen.getByText(SIGNUP_LAUNCH_NOTICE)).toBeInTheDocument()
  })
})

describe('marketing consent gating', () => {
  it('lets the user submit without ticking any consent box (consent is optional)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<WaitlistForm variant="dark" />)
    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
    fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
    fireEvent.change(screen.getByPlaceholderText('12 34 56 78'), { target: { value: '12345678' } })
    // No consent tick — must NOT block submit.
    fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.consent).toEqual({ version: CONSENT_VERSION, mad: false, group: false })
  })

  it('lets the user submit without a mobile number (mobile is optional)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<WaitlistForm variant="dark" />)
    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
    fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
    // No mobile entered.
    fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.phone).toBe('')
  })

  async function submitWithConsent(setup: () => void) {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<WaitlistForm variant="dark" />)
    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
    fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
    fireEvent.change(screen.getByPlaceholderText('12 34 56 78'), { target: { value: '12345678' } })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    return JSON.parse(fetchMock.mock.calls[0][1].body)
  }

  it('sends mad + group when the broad sentence is ticked', async () => {
    const body = await submitWithConsent(() => fireEvent.click(screen.getByRole('checkbox')))
    expect(body.consent).toEqual({ version: CONSENT_VERSION, mad: true, group: true })
  })

  it('sends mad only when the narrow Altid Mad sentence is ticked', async () => {
    const body = await submitWithConsent(() => {
      fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_NARROW_LINK }))
      fireEvent.click(screen.getByRole('checkbox'))
    })
    expect(body.consent).toEqual({ version: CONSENT_VERSION, mad: true, group: false })
  })

  it('sends neither flag when the box is unticked, including after a scope swap cleared a tick', async () => {
    const body = await submitWithConsent(() => {
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(screen.getByRole('button', { name: SIGNUP_CONSENT_NARROW_LINK }))
    })
    expect(body.consent).toEqual({ version: CONSENT_VERSION, mad: false, group: false })
  })
})
