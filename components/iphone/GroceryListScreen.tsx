'use client'

import { TabBar, HomeIndicator } from './PhoneShell'
import Slot from './Slot'

type Props = { hovered: boolean }

const TEAL = '#0f6e68'
const MINT = '#bfe6e0'

// Auto-generated grocery list with the cheapest store per item. The salmon
// row is the interactive one: on hover Altid Mad finds a better price and
// moves it from føtex to Bilka, and the total/saving roll with it.
const ITEMS = [
  { name: 'Hakket oksekød 500 g', price: '32 kr.', store: 'Netto', done: true },
  { name: 'Kyllingefilet 900 g', price: '55 kr.', store: 'REMA 1000', done: true },
  { name: 'Laksefilet 400 g', price: '49 kr.', store: 'føtex', done: false, swap: { price: '39 kr.', store: 'Bilka' } },
  { name: 'Pasta, fuldkorn', price: '12 kr.', store: 'Netto', done: false },
  { name: 'Grøntsager, frost', price: '18 kr.', store: 'Bilka', done: false },
]

function Check({ done }: { done: boolean }) {
  return (
    <span
      className="shrink-0 flex items-center justify-center"
      style={{
        width: 16,
        height: 16,
        borderRadius: 6,
        background: done ? TEAL : 'transparent',
        border: done ? 'none' : '1.5px solid rgba(15,110,104,0.3)',
      }}
    >
      {done && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
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
          <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }}>
            Altid Mad · Uge 27
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

      {/* Items with the cheapest store per line */}
      <div className="mx-4 mb-3 rounded-2xl shrink-0" style={{ background: 'white', border: '1px solid rgba(15,110,104,0.1)', overflow: 'hidden' }}>
        {ITEMS.map((item, i) => {
          const swapped = item.swap && hovered
          return (
            <div
              key={item.name}
              className="flex items-center gap-2.5 px-3.5 py-[8px]"
              style={{
                borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(15,110,104,0.06)' : 'none',
                background: swapped ? 'rgba(191,230,224,0.28)' : 'transparent',
                transition: 'background 0.45s ease',
              }}
            >
              <Check done={item.done} />
              <span
                className="flex-1 font-semibold"
                style={{
                  fontSize: 10,
                  color: item.done ? 'var(--text-light)' : 'var(--text-dark)',
                  textDecoration: item.done ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(15,110,104,0.35)',
                }}
              >
                {item.name}
              </span>
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'rgba(15,110,104,0.08)',
                  color: TEAL,
                  animation: swapped ? 'badge-glow 1.4s ease 2' : 'none',
                }}
              >
                {item.swap ? <Slot from={item.store} to={item.swap.store} hovered={hovered} h={10} /> : item.store}
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-dark)', minWidth: 30, textAlign: 'right' }}>
                {item.swap ? <Slot from={item.price} to={item.swap.price} hovered={hovered} h={12} /> : item.price}
              </span>
            </div>
          )
        })}
      </div>

      {/* Total + saving vs. buying everything in one store */}
      <div className="mx-4 shrink-0 px-4 py-3 rounded-2xl flex items-center justify-between" style={{ background: TEAL }}>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>I alt denne uge</p>
          <p className="font-bold text-white" style={{ fontSize: 18, lineHeight: 1 }}>
            <Slot from="486" to="476" hovered={hovered} h={22} />
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}> kr.</span>
          </p>
        </div>
        <div className="text-right">
          <p style={{ fontSize: 9, color: MINT, marginBottom: 1 }}>Du sparer</p>
          <p className="font-bold" style={{ fontSize: 14, lineHeight: 1, color: MINT }}>
            <Slot from="96" to="118" hovered={hovered} h={16} />
            <span style={{ fontSize: 9, fontWeight: 400 }}> kr.</span>
          </p>
        </div>
      </div>

      <TabBar active="forbrug" />
      <HomeIndicator />
    </>
  )
}
