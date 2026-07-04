import { H2, EYEBROW, BODY } from '@/lib/typography'

// "To spørgsmål der koster tid og penge hver eneste uge" (Mad CVI frame node
// 44:1060): copy column with two tilted question cards next to a full-bleed
// supermarket photo. Replaces the Hjem site's bills→app animation.

const QUESTION_CARDS = [
  {
    q: 'Hvad skal vi have til aftensmad?',
    a: 'Altid Mad løser det automatisk – med en skræddersyet madplan og uendelig inspiration, tilpasset præcis din families smag og størrelse.',
    background: '#0f6e68',
    color: '#ffffff',
    rotate: -3,
  },
  {
    q: 'Hvor handler vi billigst ind?',
    a: 'Altid Mad finder automatisk de billigste varer til din madplan – på tværs af de butikker, du selv vælger. Du får en færdig indkøbsliste med de laveste priser, så du altid handler smart uden at løfte en finger.',
    background: '#bfe6e0',
    color: '#163223',
    rotate: 4,
  },
]

// Milk carton + apple line-art from the frame's bottom-left corner.
function MilkAndApple() {
  return (
    <svg width="120" height="110" viewBox="0 0 120 110" fill="none" aria-hidden>
      <g stroke="#bfe6e0" strokeWidth="5" strokeLinejoin="round">
        <path d="M18 42l8-14h26l8 14v52H18V42Z" />
        <path d="M26 28v-8h22v8" />
      </g>
      <g stroke="#0f6e68" strokeWidth="5">
        <circle cx="82" cy="72" r="24" />
        <path d="M82 48c0-8 5-12 10-13" strokeLinecap="round" />
        <path d="M92 38c4-1 8 1 9 4-3 2-8 2-10-1" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export default function Problem() {
  return (
    <section className="relative" style={{ background: '#ffffff' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left — copy + tilted question cards */}
        <div className="flex flex-col px-[clamp(28px,4.6vw,92px)] py-[clamp(56px,6.5vw,120px)]">
          <p className={`${EYEBROW} mb-5`} style={{ color: '#0f6e68' }}>
            Problemet, vi løser automatisk
          </p>
          <h2 className={`${H2} mb-7`} style={{ color: '#163223', maxWidth: 640 }}>
            To spørgsmål der koster tid og penge hver eneste uge
          </h2>
          <p className={BODY} style={{ color: '#6f6a61', maxWidth: 620 }}>
            I dag er fødevarer dyrere end nogensinde – og alligevel skal hverdagens måltider planlægges, indkøb gennemføres og budgettet holdes. Altid Mad løser de to spørgsmål, der optager mest tid og energi i ethvert travlt hjem – helt automatisk, uge efter uge.
          </p>

          {/* The two questions as loosely thrown "notes" — slight rotation and
              overlap like the frame. */}
          <div className="relative mt-12 max-w-[640px]">
            <div
              className="rounded-[16px] px-7 py-6"
              style={{
                background: QUESTION_CARDS[0].background,
                color: QUESTION_CARDS[0].color,
                transform: `rotate(${QUESTION_CARDS[0].rotate}deg)`,
                maxWidth: 460,
                boxShadow: '0 10px 26px rgba(15,55,50,0.18)',
              }}
            >
              <p className="text-[18px] font-medium mb-2">{QUESTION_CARDS[0].q}</p>
              <p className="text-[14px] leading-[1.6]" style={{ opacity: 0.92 }}>{QUESTION_CARDS[0].a}</p>
            </div>
            <div
              className="rounded-[16px] px-7 py-6 mt-4 lg:-mt-4 ml-auto"
              style={{
                background: QUESTION_CARDS[1].background,
                color: QUESTION_CARDS[1].color,
                transform: `rotate(${QUESTION_CARDS[1].rotate}deg)`,
                maxWidth: 460,
                boxShadow: '0 10px 26px rgba(15,55,50,0.14)',
              }}
            >
              <p className="text-[18px] font-medium mb-2">{QUESTION_CARDS[1].q}</p>
              <p className="text-[14px] leading-[1.6]" style={{ opacity: 0.85 }}>{QUESTION_CARDS[1].a}</p>
            </div>
          </div>

          <div className="mt-12 hidden lg:block">
            <MilkAndApple />
          </div>
        </div>

        {/* Right — full-bleed supermarket photo; drives the lg row height */}
        <div className="relative">
          <div className="lg:absolute lg:inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/problem-supermarked.jpg"
              alt="Mand vælger grøntsager i supermarkedets køleafdeling"
              loading="lazy"
              decoding="async"
              className="w-full h-72 sm:h-96 lg:h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
