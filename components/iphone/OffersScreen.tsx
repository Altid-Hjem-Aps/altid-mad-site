'use client'

import { TabBar, HomeIndicator } from './PhoneShell'

type Props = { hovered: boolean }

const TEAL = '#0f6e68'
const MINT = '#bfe6e0'

// This week's matched offers. The top card is the interactive one: on hover
// it gets added to the meal plan ("Tilføjet ✓").
const OFFERS = [
  { name: 'Kyllingefilet 900 g', store: 'Netto', price: '29 kr.', was: '42 kr.', save: '-31%', addable: true },
  { name: 'Laksefilet 400 g', store: 'føtex', price: '39 kr.', was: '55 kr.', save: '-29%', addable: false },
  { name: 'Rugbrød, 2 stk.', store: 'REMA 1000', price: '25 kr.', was: '34 kr.', save: '2 for 1', addable: false },
]

export default function OffersScreen({ hovered }: Props) {
  return (
    <>
      <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }}>
            Til jer · lige nu
          </p>
          <h2 className="text-base font-bold" style={{ color: TEAL }}>
            Ugens tilbud
          </h2>
        </div>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            padding: '3px 7px',
            borderRadius: 8,
            background: MINT,
            color: TEAL,
          }}
        >
          Matcher jeres smag
        </span>
      </div>

      <div className="mx-4 flex flex-col gap-2 shrink-0">
        {OFFERS.map((o) => {
          const added = o.addable && hovered
          return (
            <div
              key={o.name}
              className="px-3.5 py-2.5 rounded-2xl"
              style={{
                background: 'white',
                border: added ? '1px solid rgba(15,110,104,0.35)' : '1px solid rgba(15,110,104,0.1)',
                transition: 'border-color 0.4s ease',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="flex-1 font-bold" style={{ fontSize: 10.5, color: 'var(--text-dark)' }}>
                  {o.name}
                </span>
                <span
                  style={{
                    fontSize: 7.5,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: MINT,
                    color: TEAL,
                  }}
                >
                  {o.save}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-light)' }}>{o.store}</span>
                <span className="flex-1" />
                <span style={{ fontSize: 9, color: 'var(--text-light)', textDecoration: 'line-through' }}>{o.was}</span>
                <span className="font-bold" style={{ fontSize: 12, color: TEAL }}>{o.price}</span>
              </div>
              {o.addable && (
                <div
                  className="mt-2 flex items-center justify-center rounded-full font-bold"
                  style={{
                    padding: '5px 0',
                    fontSize: 9,
                    background: added ? TEAL : MINT,
                    color: added ? MINT : TEAL,
                    transition: 'background 0.4s ease, color 0.4s ease',
                    animation: added ? 'badge-glow 1.4s ease 1' : 'none',
                  }}
                >
                  {added ? 'Tilføjet til madplanen ✓' : 'Føj til madplanen'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* AI nudge — the offers feed straight into the plan */}
      <div className="mx-4 mt-3 shrink-0 px-3.5 py-2 rounded-2xl flex flex-col gap-1" style={{ background: TEAL }}>
        <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT }}>
          Personlig AI
        </span>
        <p className="font-bold text-white" style={{ fontSize: 11, lineHeight: 1.3 }}>
          12 tilbud matcher jeres madplan
        </p>
        <span style={{ fontSize: 9, fontWeight: 600, color: MINT }}>Opdatér madplanen →</span>
      </div>

      <TabBar active="sparetips" />
      <HomeIndicator />
    </>
  )
}
