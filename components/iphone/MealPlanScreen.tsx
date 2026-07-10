'use client'

import { TabBar, HomeIndicator } from './PhoneShell'
import Slot from './Slot'

type Props = { hovered: boolean }

const TEAL = '#0f6e68'
const MINT = '#bfe6e0'

// Mon–Fri meal plan mirroring the madplan flow's week — same dishes and food
// photos. Three rows carry a Tilbud badge (matching the header's "3 retter på
// tilbud"); Thursday is the interactive row: on hover Altid Mad swaps the
// dish for a fourth offer and the saving ticks up in the header.
type Day = {
  day: string
  dish: string
  img: string
  price: string
  offer?: boolean
  tag?: { label: string; bg: string; ink: string }
  swap?: { dish: string; img: string; price: string }
}
const DAYS: Day[] = [
  { day: 'Man', dish: 'Kylling i karry', img: '/food/kylling-karry.jpg', price: '52 kr.', offer: true },
  { day: 'Tir', dish: 'Pasta med grønt', img: '/food/pasta-groent.jpg', price: '38 kr.', offer: true },
  { day: 'Ons', dish: 'Laksewok', img: '/food/laksewok.jpg', price: '64 kr.', offer: true },
  { day: 'Tor', dish: 'Vegetarlasagne', img: '/food/lasagne.jpg', price: '55 kr.', tag: { label: 'Mindre kød', bg: 'rgba(15,110,104,0.1)', ink: TEAL }, swap: { dish: 'Chili con carne', img: '/food/chili-con-carne.jpg', price: '41 kr.' } },
  { day: 'Fre', dish: 'Pizzafredag', img: '/food/pizzafredag.jpg', price: '46 kr.', tag: { label: 'Favorit', bg: 'rgba(15,110,104,0.1)', ink: TEAL } },
]

export default function MealPlanScreen({ hovered }: Props) {
  return (
    <>
      <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }}>
            Altid Mad
          </p>
          <h2 className="text-base font-bold" style={{ color: TEAL }}>
            Ugens madplan
          </h2>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/services/icon-mad.svg" alt="" style={{ width: 30, height: 30, flexShrink: 0 }} />
      </div>

      {/* Week saving — ticks up when Thursday is swapped to the offer dish */}
      <div className="mx-4 mb-3 px-4 py-2.5 rounded-2xl shrink-0 flex items-center justify-between" style={{ background: TEAL }}>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>Ugens besparelse</p>
          <p className="font-bold text-white" style={{ fontSize: 20, lineHeight: 1 }}>
            <Slot from="298" to="312" hovered={hovered} h={24} />
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}> kr.</span>
          </p>
        </div>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            padding: '3px 7px',
            borderRadius: 8,
            background: MINT,
            color: TEAL,
            animation: hovered ? 'badge-glow 1.4s ease 2' : 'none',
          }}
        >
          {hovered ? '4 retter på tilbud' : '3 retter på tilbud'}
        </span>
      </div>

      {/* The five dinners */}
      <div className="mx-4 mb-3 rounded-2xl shrink-0" style={{ background: 'white', border: '1px solid rgba(15,110,104,0.1)', overflow: 'hidden' }}>
        {DAYS.map((d, i) => {
          const swapped = d.swap && hovered
          return (
            <div
              key={d.day}
              className="flex items-center gap-[3px] px-2.5 py-[7px]"
              style={{
                borderBottom: i < DAYS.length - 1 ? '1px solid rgba(15,110,104,0.06)' : 'none',
                background: swapped ? 'rgba(191,230,224,0.28)' : 'transparent',
                transition: 'background 0.45s ease',
              }}
            >
              <span
                className="shrink-0 flex items-center justify-center font-bold"
                style={{ width: 21, height: 21, borderRadius: 7, fontSize: 7.5, background: 'rgba(191,230,224,0.5)', color: TEAL }}
              >
                {d.day}
              </span>
              {/* Dish photo — Thursday crossfades to the offer dish on hover. */}
              <span className="relative shrink-0" style={{ width: 21, height: 21 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.img}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ borderRadius: 7, opacity: swapped ? 0 : 1, transition: 'opacity 0.45s ease' }}
                />
                {d.swap && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.swap.img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ borderRadius: 7, opacity: swapped ? 1 : 0, transition: 'opacity 0.45s ease' }}
                  />
                )}
              </span>
              <span className="flex-1 min-w-0 truncate font-semibold" style={{ fontSize: 9.5, color: 'var(--text-dark)', paddingLeft: 2 }}>
                {d.swap ? <Slot from={d.dish} to={d.swap.dish} hovered={hovered} h={14} /> : d.dish}
              </span>
              {(d.offer || swapped) && (
                <span
                  style={{
                    fontSize: 6.5,
                    fontWeight: 700,
                    padding: '2px 4px',
                    borderRadius: 6,
                    background: MINT,
                    color: TEAL,
                  }}
                >
                  Tilbud
                </span>
              )}
              {d.tag && !swapped && (
                <span
                  style={{
                    fontSize: 6.5,
                    fontWeight: 700,
                    padding: '2px 4px',
                    borderRadius: 6,
                    background: d.tag.bg,
                    color: d.tag.ink,
                  }}
                >
                  {d.tag.label}
                </span>
              )}
              <span style={{ fontSize: 9, color: 'var(--text-light)', minWidth: 24, textAlign: 'right' }}>
                {d.swap ? <Slot from={d.price} to={d.swap.price} hovered={hovered} h={12} /> : d.price}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status card — the plan turns into a ready grocery list */}
      <div className="mx-4 shrink-0 px-3.5 py-2 rounded-2xl flex flex-col gap-1" style={{ background: TEAL }}>
        <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT }}>
          Automatisk
        </span>
        <p className="font-bold text-white" style={{ fontSize: 11, lineHeight: 1.3 }}>
          {hovered ? 'Madplanen er opdateret' : 'Madplanen er klar'}
        </p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>
          Indkøbslisten er genereret med ugens laveste priser
        </p>
        <span style={{ fontSize: 9, fontWeight: 600, color: MINT }}>Se indkøbslisten →</span>
      </div>

      <TabBar active="hjem" />
      <HomeIndicator />
    </>
  )
}
