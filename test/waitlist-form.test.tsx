import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import WaitlistForm from '@/components/WaitlistForm'
import {
  CONSENT_VERSION,
  SIGNUP_CONSENT_MAD,
  SIGNUP_CONSENT_GROUP,
  SIGNUP_LAUNCH_NOTICE,
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
  fireEvent.click(screen.getAllByRole('checkbox')[0]) // tick required Mad consent
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
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // tick required Mad consent
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

describe('consent copy: launch notice separated from marketing', () => {
  it('drops "lanceringer" from the Mad box but keeps it in the group box', () => {
    // The Mad launch is covered by signing up (the §10 consent for that one mail),
    // so it must not sit behind the optional Mad marketing box. The other brands'
    // launches are marketing a Mad signer never asked for, so they stay in the
    // group box.
    expect(SIGNUP_CONSENT_MAD).not.toContain('lanceringer')
    expect(SIGNUP_CONSENT_GROUP).toContain('lanceringer')
  })

  it('shows the signup-grounded launch notice once the visitor starts typing', () => {
    render(<WaitlistForm variant="dark" />)
    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
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

  it('sends the documented consent (version + both choices) in the POST body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<WaitlistForm variant="dark" />)
    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
    fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
    fireEvent.change(screen.getByPlaceholderText('12 34 56 78'), { target: { value: '12345678' } })
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // Mad
    fireEvent.click(screen.getAllByRole('checkbox')[1]) // group
    fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.consent).toEqual({ version: CONSENT_VERSION, mad: true, group: true })
  })
})
