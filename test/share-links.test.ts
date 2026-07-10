import { describe, expect, it } from 'vitest'
import { buildShareLinks } from '@/lib/share-links'

// Share buttons in the referral emails are only as good as their URLs: a
// mis-encoded link sends people to a broken share dialog. Lock the format.
describe('buildShareLinks', () => {
  const invite = 'https://altidmad.dk/?ref=ABC123'
  const enc = 'https%3A%2F%2Faltidmad.dk%2F%3Fref%3DABC123'
  const links = buildShareLinks(invite)

  it('passes the encoded url to link-only channels', () => {
    expect(links.facebook).toBe(`https://www.facebook.com/sharer/sharer.php?u=${enc}`)
    expect(links.linkedin).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`)
  })

  it('carries message + link for whatsapp, sms and email', () => {
    for (const link of [links.whatsapp, links.sms, links.email]) {
      expect(link).toContain('Tilmeld%20dig%20med%20mit%20link')
      expect(link).toContain(enc)
    }
    expect(links.whatsapp.startsWith('https://wa.me/?text=')).toBe(true)
    expect(links.sms.startsWith('sms:?&body=')).toBe(true)
    expect(links.email).toContain('subject=Kom%20med%20p%C3%A5%20Altid%20Mad')
  })

  it('uses the messenger app deep link', () => {
    expect(links.messenger).toBe(`fb-messenger://share/?link=${enc}`)
  })

  it('does not leak a raw unencoded url', () => {
    expect(links.facebook).not.toContain('?ref=ABC123')
  })
})
