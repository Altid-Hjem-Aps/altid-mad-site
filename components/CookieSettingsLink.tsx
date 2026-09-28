'use client'

import { openCookieSettings } from '@/lib/cookie-consent'

// Entry point for changing the cookie choice later (footer, privacy policy).
// A button, not a link: it reopens the banner on the current page.
export default function CookieSettingsLink({
  className = 'underline-offset-2 hover:underline',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button type="button" onClick={openCookieSettings} className={className} style={style}>
      Cookieindstillinger
    </button>
  )
}
