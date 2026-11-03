import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import CookieSettingsLink from '@/components/CookieSettingsLink'
import { COOKIE_SETTINGS_URL, fetchPrivacyPolicy, parseInline, type PolicyBlock, type PolicySection } from '@/lib/privacyPolicy'

export const metadata: Metadata = {
  title: 'Privatlivspolitik – Altid Mad',
  description: 'Læs om hvordan Altid Hjem ApS behandler dine personoplysninger.',
}

const LINK = 'underline underline-offset-2 transition-colors hover:text-white'
const LABEL = 'font-semibold text-white'
const LIST = 'space-y-1.5 list-disc list-outside ml-5'
const ITEM_LABEL = 'font-medium text-white/80'
const H2 = 'text-white font-semibold text-base mb-3'

const COOKIES_TITLE = /^\d+\. Cookies$/
const SHARING_TITLE = /^(\d+)\. Deling af oplysninger$/

function formatUpdated(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((segment, i) => {
        if (!('url' in segment)) return segment.text
        if (segment.url === COOKIE_SETTINGS_URL) return <CookieSettingsLink key={i} className={LINK} />
        if (segment.url.startsWith('mailto:')) return <a key={i} href={segment.url} className={LINK}>{segment.text}</a>
        if (segment.url.startsWith('https://')) {
          return <a key={i} href={segment.url} target="_blank" rel="noopener noreferrer" className={LINK}>{segment.text}</a>
        }
        throw new Error(`Unsupported privacy policy link: ${segment.url}`)
      })}
    </>
  )
}

function Block({ block, afterLabel }: { block: Exclude<PolicyBlock, { type: 'label' }>; afterLabel: boolean }) {
  switch (block.type) {
    case 'paragraph':
      return <p><Inline text={block.text} /></p>
    case 'list':
      return (
        <ul className={afterLabel ? `${LIST} mt-1` : LIST}>
          {block.items.map((item, i) => (
            <li key={i}>
              {item.label && <><span className={ITEM_LABEL}>{item.label}:</span>{' '}</>}
              <Inline text={item.text} />
            </li>
          ))}
        </ul>
      )
    case 'address': {
      const [name, ...lines] = block.lines
      return (
        <div className="pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <p className="font-medium text-white">{name}</p>
          {lines.map((line, i) => <p key={i}><Inline text={line} /></p>)}
        </div>
      )
    }
  }
}

/** A label sticks to the block right after it; every other block stands alone. */
function renderBlocks(blocks: PolicyBlock[]): ReactNode[] {
  const out: ReactNode[] = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.type !== 'label') {
      out.push(<Block key={i} block={block} afterLabel={false} />)
      continue
    }
    const next = blocks[i + 1]
    if (!next || next.type === 'label') throw new Error(`Privacy policy label without content: ${block.text}`)
    out.push(
      <div key={i}>
        <p className={LABEL}>{block.text}</p>
        <Block block={next} afterLabel />
      </div>,
    )
    i++
  }
  return out
}

// This site's cookie banner and the "Cookieindstillinger" button act on this
// site's own cookies, so this section is ours; the rest of the policy is
// altidhjem.dk's. `sharingNumber` is the number of "Deling af oplysninger",
// where Amplitude is described.
function CookiesSection({ title, sharingNumber }: { title: string; sharingNumber: string }) {
  return (
    <section id="cookies" className="scroll-mt-28 space-y-3">
      <h2 className={H2}>{title}</h2>
      <p>Vi bruger cookies og lignende lagring i din browser (localStorage) til to ting: det, siden skal bruge for at virke, og statistik, hvis du siger ja. Første gang du besøger siden, spørger vi dig. Dit valg gemmes i 12 måneder, og derefter spørger vi igen. Du kan til enhver tid ændre dit valg: <CookieSettingsLink className={LINK} /></p>
      <div>
        <p className={LABEL}>Nødvendige (kræver ikke samtykke)</p>
        <ul className={`${LIST} mt-1`}>
          <li><span className={ITEM_LABEL}>ah-cookie-consent:</span> Husker dit cookievalg. Gemmes i 12 måneder.</li>
          <li><span className={ITEM_LABEL}>am_confirm:</span> Bruges et kort øjeblik, når du bekræfter din tilmelding til ventelisten via linket i vores e-mail. Slettes efter 30 minutter.</li>
          <li><span className={ITEM_LABEL}>ah-waitlist-joined:</span> Husker, at du er skrevet op på ventelisten, så vi ikke spørger dig igen. Gemmes, indtil du rydder din browser.</li>
          <li><span className={ITEM_LABEL}>ah-exit-intent-shown:</span> Husker, at vi har vist dig invitationen til ventelisten, så den kun vises én gang. Gemmes, indtil du rydder din browser.</li>
        </ul>
      </div>
      <div>
        <p className={LABEL}>Statistik (kun hvis du siger ja)</p>
        <ul className={`${LIST} mt-1`}>
          <li><span className={ITEM_LABEL}>AMP_* (Amplitude):</span> Et tilfældigt id for din browser, så vi kan se, hvordan siden bliver brugt på tværs af besøg: hvilke sider du ser, hvad du klikker på, og hvor du kom fra. Oplysningerne behandles af vores databehandler Amplitude i EU, se afsnit {sharingNumber}. Gemmes i op til 12 måneder. Siger du nej, eller trækker du dit ja tilbage, stopper vi statistikken og sletter disse cookies fra din browser.</li>
        </ul>
      </div>
    </section>
  )
}

function sharingSectionNumber(sections: PolicySection[]): string {
  for (const section of sections) {
    const match = SHARING_TITLE.exec(section.title)
    if (match) return match[1]
  }
  throw new Error('Privacy policy has no "Deling af oplysninger" section')
}

export default async function Privatlivspolitik() {
  const policy = await fetchPrivacyPolicy()
  if (!policy.sections.some((section) => COOKIES_TITLE.test(section.title))) {
    throw new Error('Privacy policy has no "Cookies" section')
  }
  const sharingNumber = sharingSectionNumber(policy.sections)

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-24" style={{ background: 'var(--forest)', fontFamily: 'var(--font-onest)' }}>
        <div className="max-w-2xl mx-auto px-6">

          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-10 text-white/55 transition-colors hover:text-white/85">
            <span aria-hidden="true">←</span> Tilbage
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Privatlivspolitik</h1>
          <p className="text-sm mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Altid Hjem ApS · CVR 45637476 · hej@altidhjem.dk</p>
          <p className="text-xs mb-12" style={{ color: 'rgba(255,255,255,0.55)' }}>Senest opdateret: {formatUpdated(policy.updated)}</p>

          <div className="space-y-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {policy.sections.map((section) =>
              COOKIES_TITLE.test(section.title) ? (
                <CookiesSection key={section.title} title={section.title} sharingNumber={sharingNumber} />
              ) : (
                <section key={section.title} className="space-y-3">
                  <h2 className={H2}>{section.title}</h2>
                  {renderBlocks(section.blocks)}
                </section>
              ),
            )}
          </div>
        </div>
      </main>
    </>
  )
}
