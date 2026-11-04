import { describe, expect, it } from 'vitest'
import { confirmHeading, confirmIntro, renderConsentConfirmEmail } from '@/emails/consent-confirm'
import { consentSentences } from 'altid-consent'

// The group consent on the shared waitlist is the package's `mad` group sentence:
// "Altid Hjem og resten af familien: Forsikring, Energi og Mobil". The heading
// used to name the old set (Altid Hjem, Altid Forsikring og Altid Mobil), which
// left Energi out.
describe('confirmHeading', () => {
  it('names the group scope the way the consent sentence does', () => {
    expect(confirmHeading({ mad: false, group: true })).toBe('Vil du høre nyt fra Altid Hjem og resten af familien?')
    expect(consentSentences('mad').group).toContain('Altid Hjem og resten af familien')
  })

  it('leaves the other two headings unchanged', () => {
    expect(confirmHeading({ mad: true, group: true })).toBe('Vil du høre nyt fra Altid?')
    expect(confirmHeading({ mad: true, group: false })).toBe('Vil du høre nyt om Altid Mad?')
  })
})

describe('the mail after the flip', () => {
  it('says nothing about a list, in any combination', () => {
    for (const pending of [{ mad: true, group: false }, { mad: false, group: true }, { mad: true, group: true }]) {
      expect(confirmIntro(pending)).toMatch(/^Du har netop bedt om/)
      expect(renderConsentConfirmEmail({ firstName: 'Karen', confirmUrl: 'https://x', unsubscribeUrl: 'https://y', pending })).not.toMatch(/venteliste/i)
    }
  })

  it('greets by name when there is one, and plainly when there is none', () => {
    const vars = { confirmUrl: 'https://x', unsubscribeUrl: 'https://y', pending: { mad: true, group: false } }
    expect(renderConsentConfirmEmail({ ...vars, firstName: 'Karen' })).toContain('>Hej Karen</p>')
    expect(renderConsentConfirmEmail({ ...vars, firstName: '' })).toContain('>Hej</p>')
  })
})
