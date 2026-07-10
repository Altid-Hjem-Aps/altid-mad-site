'use client'

import { TabBar, HomeIndicator } from './PhoneShell'
import Slot from './Slot'

type Props = { hovered: boolean }

const TEAL = '#0f6e68'
const MINT = '#bfe6e0'
const SAVE_TEAL = '#3d9187'

// ISO 8601 week number — keeps the mockup's "Uge NN" current instead of a
// hardcoded week that goes stale.
function isoWeek(d = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// The week's list grouped per store — styled like the flow's Bilka list with
// the chains' own app icons. Every row shows the normal price struck through
// next to the price Altid Mad found; each group ends with its remaining item
// count and the store's total saving. Counts mirror the flow's trip (8+12+13
// = 33 varer, 3 shown per store) and the group savings sum to the header card
// (28+31+37 = 96 kr., → 102 kr. when the coffee row finds a better price on
// hover: REMA 37→43, total 486→480).
type Store = { key: string; name: string; logo: string; count: number; save: string; saveHover?: string; round?: boolean }
const STORES: Store[] = [
  { key: 'bilka', name: 'Bilka', logo: '/logos/bilka.png', count: 8, save: '28 kr.' },
  { key: 'netto', name: 'Netto', logo: '/logos/netto.png', count: 12, save: '31 kr.', round: true },
  { key: 'rema', name: 'REMA 1000', logo: '/logos/rema.png', count: 13, save: '37 kr.', saveHover: '43 kr.' },
]

type Item = { name: string; was: string; price: string; done?: boolean; swap?: { price: string } }
const LIST: Record<string, Item[]> = {
  bilka: [
    { name: 'Smør, 200 g', was: '19 kr.', price: '15 kr.', done: true },
    { name: 'Koldrøget laks', was: '52 kr.', price: '45 kr.', done: true },
    { name: 'Æg, 10 stk.', was: '28 kr.', price: '24 kr.' },
  ],
  netto: [
    { name: 'Hakket oksekød', was: '39 kr.', price: '32 kr.', done: true },
    { name: 'Minimælk, 1 L', was: '11 kr.', price: '8 kr.' },
    { name: 'Rugbrød, 950 g', was: '18 kr.', price: '14 kr.' },
  ],
  rema: [
    { name: 'Kyllingefilet', was: '42 kr.', price: '29 kr.' },
    { name: 'Toiletpapir, 8 rl.', was: '32 kr.', price: '27 kr.' },
    { name: 'Kaffe, 400 g', was: '49 kr.', price: '45 kr.', swap: { price: '39 kr.' } },
  ],
}

function Check({ done }: { done: boolean }) {
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: 15,
        height: 15,
        background: done ? TEAL : 'transparent',
        border: done ? 'none' : '1.5px solid rgba(15,110,104,0.3)',
      }}
    >
      {done && (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5.5L4 8L8.5 2.5" stroke={MINT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export default function GroceryListScreen({ hovered }: Props) {
  return (
    <>
      <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
        <div>
          {/* The static prerender carries the build week; the client corrects
              it at hydration — suppress the expected text mismatch. */}
          <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }} suppressHydrationWarning>
            Altid Mad · Uge {isoWeek()}
          </p>
          <h2 className="text-base font-bold" style={{ color: TEAL }}>
            Indkøbsliste
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
          Delt med familien
        </span>
      </div>

      {/* Total + saving first — the week's result before the list detail */}
      <div className="mx-4 mb-3 shrink-0 px-4 py-2.5 rounded-2xl flex items-center justify-between" style={{ background: TEAL }}>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>I alt denne uge</p>
          <p className="font-bold text-white" style={{ fontSize: 18, lineHeight: 1 }}>
            <Slot from="486" to="480" hovered={hovered} h={22} />
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}> kr.</span>
          </p>
        </div>
        <div className="text-right">
          <p style={{ fontSize: 9, color: MINT, marginBottom: 1 }}>Du sparer</p>
          <p className="font-bold" style={{ fontSize: 14, lineHeight: 1, color: MINT }}>
            <Slot from="96" to="102" hovered={hovered} h={16} />
            <span style={{ fontSize: 9, fontWeight: 400 }}> kr.</span>
          </p>
        </div>
      </div>

      {/* Grouped per store: normal price struck out, Altid Mad's price, and
          the store's remaining items + saving on the group footer. */}
      <div className="mx-4 rounded-2xl shrink-0 px-3 py-[3px]" style={{ background: 'white', border: '1px solid rgba(15,110,104,0.1)' }}>
        {STORES.map((store, si) => (
          <div key={store.key} style={{ borderTop: si > 0 ? '1px solid rgba(15,110,104,0.08)' : 'none' }} className="py-[6px]">
            <div className="flex items-center gap-1.5 mb-[4px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={store.logo}
                alt=""
                className="shrink-0 object-contain"
                style={{ width: 13, height: 13, borderRadius: store.round ? '50%' : 3 }}
              />
              <span className="font-bold" style={{ fontSize: 9, color: 'var(--text-dark)' }}>{store.name}</span>
              <span style={{ fontSize: 7.5, color: 'var(--text-light)' }}>{store.count} varer</span>
            </div>
            <div className="flex flex-col gap-[4px]">
              {LIST[store.key].map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <Check done={!!item.done} />
                  <span
                    className="flex-1 min-w-0 truncate font-semibold"
                    style={{
                      fontSize: 9.5,
                      color: item.done ? 'var(--text-light)' : 'var(--text-dark)',
                      textDecoration: item.done ? 'line-through' : 'none',
                      textDecorationColor: 'rgba(15,110,104,0.35)',
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    className="shrink-0"
                    style={{ fontSize: 8, color: 'var(--text-light)', textDecoration: 'line-through', textDecorationColor: 'rgba(22,50,35,0.3)' }}
                  >
                    {item.was}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, minWidth: 26, textAlign: 'right' }}>
                    {item.swap ? <Slot from={item.price} to={item.swap.price} hovered={hovered} h={12} /> : item.price}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-[4px] flex items-center justify-between">
              <span style={{ fontSize: 7.5, color: 'var(--text-light)' }}>+ {store.count - LIST[store.key].length} varer</span>
              <span className="font-bold" style={{ fontSize: 8, color: SAVE_TEAL }}>
                Du sparer{' '}
                {store.saveHover ? <Slot from={store.save} to={store.saveHover} hovered={hovered} h={10} /> : store.save}
              </span>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="mad" />
      <HomeIndicator />
    </>
  )
}
