import { readCookieChoice } from '@/lib/cookie-consent'
import { startAnalytics } from '@/lib/analytics'

// Returning visitors who already accepted statistics start Amplitude before
// React hydrates. Everyone else waits for the cookie banner (CookieBanner).
if (readCookieChoice() === 'all') startAnalytics()
