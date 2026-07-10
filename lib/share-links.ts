// Social-share URLs for a personal referral invite link (Mad-flavoured port
// of the Hjem site's lib/share-links.ts).
//
// Pure string builders, no network calls, so the /inviter page can render
// "share to X" buttons and the logic stays unit-testable. Channels that carry
// a message (WhatsApp, SMS, Email) share a single pre-built text; link-only
// channels (Facebook, LinkedIn) just take the encoded URL.
//
// Messenger uses the mobile app deep link. It opens Messenger on phones that
// have the app; desktop web sharing would require a Facebook App ID we do not
// have yet, so on desktop this link is a no-op until that is wired up.

function shareText(inviteUrl: string): string {
  return `Kom med på Altid Mad. Tilmeld dig med mit link: ${inviteUrl}`
}

export interface ShareLinks {
  whatsapp: string
  sms: string
  facebook: string
  messenger: string
  linkedin: string
  email: string
}

export function buildShareLinks(inviteUrl: string): ShareLinks {
  const url = encodeURIComponent(inviteUrl)
  const text = encodeURIComponent(shareText(inviteUrl))
  const subject = encodeURIComponent('Kom med på Altid Mad')
  return {
    whatsapp: `https://wa.me/?text=${text}`,
    sms: `sms:?&body=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    messenger: `fb-messenger://share/?link=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    email: `mailto:?subject=${subject}&body=${text}`,
  }
}
