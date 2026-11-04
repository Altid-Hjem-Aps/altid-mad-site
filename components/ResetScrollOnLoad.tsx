'use client'

import { useEffect } from 'react'

// Force reload to land at the top of the page. Browsers default to
// "auto" scroll restoration, which restores the user's previous scroll
// position on reload — fine for blogs, surprising for a landing page
// where reload is a deliberate "start over". We opt out manually and scroll
// to top on mount, except when the URL names a section (/#hent-appen from the
// nav on another page or a shared link): then the browser's jump stands.
export default function ResetScrollOnLoad() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    if (window.location.hash) return
    window.scrollTo(0, 0)
  }, [])
  return null
}
