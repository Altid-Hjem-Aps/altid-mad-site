'use client'

import { TabBar, HomeIndicator } from './PhoneShell'

type Props = { hovered: boolean }

const TEAL = '#3E6924'
const MINT = '#DCD799'

// Personlig AI: the app asks how the week's plan landed — per-dish thumbs and
// whether the saving felt right — and tunes next week from the answers. On
// hover the questionnaire fills itself in (👍 kylling, 👎 laksewok, "Ja" to
// the saving) and the AI confirms the adjustment in the bottom card.
const DISHES = [
  { name: 'Kylling i karry', img: '/food/kylling-karry.jpg', liked: true },
  { name: 'Laksewok', img: '/food/laksewok.jpg', liked: false },
]

function ThumbIcon({ down = false, color }: { down?: boolean; color: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ transform: down ? 'rotate(180deg)' : 'none' }}
    >
      <path
        d="M7 10.5L11.2 4.6c.3-.4.8-.6 1.3-.5.9.2 1.5 1 1.5 1.9V9h4.1c1.3 0 2.2 1.2 2 2.4l-1.1 6.3a2 2 0 0 1-2 1.7H9.5A2.5 2.5 0 0 1 7 16.9V10.5z"
        fill={color}
      />
      <rect x="3" y="9.8" width="2.6" height="9.6" rx="1.3" fill={color} />
    </svg>
  )
}

// A thumbs chip — fills teal when its answer gets picked (on hover).
function ThumbChip({ down = false, picked }: { down?: boolean; picked: boolean }) {
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: 20,
        height: 20,
        background: picked ? TEAL : 'transparent',
        border: picked ? '1px solid transparent' : '1px solid rgba(62,105,36,0.25)',
        transition: 'background 0.4s ease, border-color 0.4s ease',
        animation: picked ? 'badge-glow 1.4s ease 1' : 'none',
      }}
    >
      <ThumbIcon down={down} color={picked ? MINT : 'rgba(22,50,35,0.45)'} />
    </span>
  )
}

export default function OffersScreen({ hovered }: Props) {
  return (
    <>
      <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }}>
            Altid Mad
          </p>
          {/* Sized so the question stays on ONE line in the 270px shell. */}
          <h2 className="font-bold whitespace-nowrap" style={{ color: TEAL, fontSize: 13.5 }}>
            Er der noget vi skal justere?
          </h2>
        </div>
      </div>

      {/* The AI leads the screen — this week's check-in */}
      <div className="mx-4 mb-3 shrink-0 px-3.5 py-2.5 rounded-2xl flex flex-col gap-0.5" style={{ background: TEAL }}>
        <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT }}>
          Personlig AI
        </span>
        <p className="font-bold text-white" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
          Hvordan var ugens madplan?
        </p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>
          Jeres svar gør næste uges plan bedre
        </p>
      </div>

      {/* Per-dish feedback */}
      <div className="mx-4 mb-2 rounded-2xl shrink-0 px-3 py-1" style={{ background: 'white', border: '1px solid rgba(62,105,36,0.1)' }}>
        {DISHES.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center gap-1.5 py-[8px]"
            style={{ borderTop: i > 0 ? '1px solid rgba(62,105,36,0.06)' : 'none' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt="" className="shrink-0 object-cover" style={{ width: 20, height: 20, borderRadius: 7 }} />
            <span className="flex-1 min-w-0 truncate font-semibold" style={{ fontSize: 9.5, color: 'var(--text-dark)' }}>
              {d.name}
            </span>
            <ThumbChip picked={hovered && d.liked} />
            <ThumbChip down picked={hovered && !d.liked} />
          </div>
        ))}
      </div>

      {/* Did the saving feel right? — with room for a free-text comment */}
      <div className="mx-4 rounded-2xl shrink-0 px-3 py-2.5" style={{ background: 'white', border: '1px solid rgba(62,105,36,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0 font-semibold" style={{ fontSize: 10, color: 'var(--text-dark)' }}>
            Passede besparelsen på 312 kr.?
          </span>
          {(['Ja', 'Nej'] as const).map((label) => {
            const picked = hovered && label === 'Ja'
            return (
              <span
                key={label}
                className="shrink-0 flex items-center justify-center rounded-full font-bold"
                style={{
                  padding: '3px 9px',
                  fontSize: 8.5,
                  background: picked ? TEAL : 'transparent',
                  color: picked ? MINT : 'rgba(22,50,35,0.45)',
                  border: picked ? '1px solid transparent' : '1px solid rgba(62,105,36,0.25)',
                  transition: 'background 0.4s ease, color 0.4s ease, border-color 0.4s ease',
                  animation: picked ? 'badge-glow 1.4s ease 1' : 'none',
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
        {/* Comment field — fills itself in on hover, like the rest of the
            questionnaire. */}
        <div
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-[5px]"
          style={{ background: 'rgba(62,105,36,0.05)', border: '1px dashed rgba(62,105,36,0.28)' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
            <path
              d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L17 5a2.1 2.1 0 0 0-3 0L3.5 15.5 3 20z"
              stroke={hovered ? TEAL : 'rgba(22,50,35,0.4)'}
              strokeWidth="2"
              strokeLinejoin="round"
              style={{ transition: 'stroke 0.4s ease' }}
            />
          </svg>
          <span
            className="min-w-0 truncate"
            style={{
              fontSize: 8.5,
              fontWeight: hovered ? 600 : 400,
              color: hovered ? 'var(--text-dark)' : 'var(--text-light)',
              transition: 'color 0.4s ease',
            }}
          >
            {hovered ? 'Lidt færre fiskeretter, tak' : 'Tilføj en kommentar (valgfrit)'}
          </span>
        </div>
      </div>

      {/* The AI acts on the answers */}
      <div className="mx-4 mt-3 shrink-0 px-3.5 py-2 rounded-2xl flex flex-col gap-1" style={{ background: TEAL }}>
        <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT }}>
          Automatisk
        </span>
        <p className="font-bold text-white" style={{ fontSize: 11, lineHeight: 1.3 }}>
          {hovered ? 'Madplanen er justeret til næste uge ✓' : 'Svar med ét tryk – appen klarer resten'}
        </p>
        <span style={{ fontSize: 9, fontWeight: 600, color: MINT }}>
          {hovered ? 'Laksewok erstattes af et nyt forslag →' : 'Se næste uges madplan →'}
        </span>
      </div>

      <TabBar active="sparetips" />
      <HomeIndicator />
    </>
  )
}
