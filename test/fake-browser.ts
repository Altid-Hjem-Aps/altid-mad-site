// A small fake browser for the Mad-testen pages (ALT-345): it runs a rendered
// page's real inline handlers (<body onload> and <body onpageshow>) against
// just the DOM those handlers touch, so a test can see what a browser would do
// with the page: which beacon it sends, whether the form sends itself, what a
// back/forward restore resets.
//
// As in a browser, each handler attribute is its own handler: an exception in
// one is reported (collected in `errors`) and the next handler still runs.

export type BeaconMode = 'ok' | 'missing' | 'throws'

export type FakeButton = { textContent: string; disabled: boolean; dataset: { l?: string } }

export type PageRun = {
  /** What happened, in order: 'beacon <url> <body>' and 'submit <button label>'. */
  events: string[]
  beacons: Array<{ url: string; body: string }>
  errors: unknown[]
  form: { dataset: Record<string, string> } | null
  buttons: FakeButton[]
}

function decode(attr: string): string {
  return attr
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** The handler a <body> attribute holds, decoded as the HTML parser would, or null. */
export function bodyHandler(html: string, name: 'onload' | 'onpageshow'): string | null {
  const body = html.match(/<body[^>]*>/)?.[0] ?? ''
  const m = body.match(new RegExp(` ${name}="([^"]*)"`))
  return m ? decode(m[1]) : null
}

/**
 * Show the page as a browser would. A fresh load fires load, then pageshow
 * (persisted false). A restore from the back/forward cache fires only pageshow
 * (persisted true), on a page whose form was already sent: its buttons say
 * "Et øjeblik" and the form carries the sent mark.
 */
export function showPage(
  html: string,
  opts: { webdriver?: boolean; sendBeacon?: BeaconMode; restore?: boolean } = {},
): PageRun {
  const { webdriver = false, sendBeacon = 'ok', restore = false } = opts
  const events: string[] = []
  const beacons: Array<{ url: string; body: string }> = []
  const errors: unknown[] = []

  const formHtml = html.match(/<form[\s\S]*?<\/form>/)?.[0] ?? null
  const buttons: FakeButton[] = [...(formHtml ?? '').matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].map((m) => {
    const l = m[1].match(/data-l="([^"]*)"/)?.[1]
    return { textContent: restore ? 'Et øjeblik' : decode(m[2]), disabled: false, dataset: l === undefined ? {} : { l: decode(l) } }
  })
  const form = formHtml
    ? {
        dataset: (restore ? { sent: '1' } : {}) as Record<string, string>,
        querySelectorAll(sel: string) {
          if (sel !== 'button') throw new Error(`fake form: unexpected querySelectorAll(${sel})`)
          return buttons
        },
        querySelector(sel: string) {
          if (sel !== 'button') throw new Error(`fake form: unexpected querySelector(${sel})`)
          return buttons[0] ?? null
        },
        requestSubmit(button: FakeButton) {
          events.push(`submit ${button.textContent}`)
        },
      }
    : null
  const gaValue = html.match(/<input id="ga"[^>]* value="([^"]*)"/)?.[1]
  const document = {
    querySelector(sel: string) {
      if (sel === 'form') return form
      if (sel === 'form button') return buttons[0] ?? null
      throw new Error(`fake document: unexpected querySelector(${sel})`)
    },
    getElementById(id: string) {
      if (id !== 'ga') throw new Error(`fake document: unexpected getElementById(${id})`)
      return gaValue === undefined ? null : { value: decode(gaValue) }
    },
  }
  const navigator: { webdriver: boolean; sendBeacon?: (url: string, body: URLSearchParams) => boolean } = { webdriver }
  if (sendBeacon === 'ok') {
    navigator.sendBeacon = (url, body) => {
      beacons.push({ url, body: body.toString() })
      events.push(`beacon ${url} ${body.toString()}`)
      return true
    }
  } else if (sendBeacon === 'throws') {
    navigator.sendBeacon = () => {
      throw new TypeError('sendBeacon failed')
    }
  }

  function fire(name: 'onload' | 'onpageshow', event: { persisted: boolean }) {
    const code = bodyHandler(html, name)
    if (code === null) return
    try {
      new Function('event', 'document', 'navigator', code)(event, document, navigator)
    } catch (e) {
      errors.push(e)
    }
  }

  if (!restore) fire('onload', { persisted: false })
  fire('onpageshow', { persisted: restore })
  return { events, beacons, errors, form, buttons }
}
