import { describe, expect, it } from 'vitest'
import { confirmHeading } from '@/emails/consent-confirm'
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
