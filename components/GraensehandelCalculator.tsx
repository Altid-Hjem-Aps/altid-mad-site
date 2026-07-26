'use client'

import { useState } from 'react'
import {
  AMBER,
  CARD_BORDER,
  CARD_SHADOW,
  CardHeader,
  Field,
  fieldStyle,
  inputCls,
  MINT,
  MINT_WASH,
  ON_TEAL_MUTED,
  parseDanishNumber,
  TEAL,
} from '@/components/seo/mockupKit'

/**
 * The interactive calculator on /graensehandel-beregner. Pure client-side
 * arithmetic on the user's own numbers: transport cost for the trip and the
 * break-even against whatever saving the user expects. The page takes no
 * position on how much anyone saves at the border — the only prefilled
 * figure is the fuel list price (Drivkraft Danmark, July 2026), and it is
 * editable. Each field is bounded to plausible values so a mistyped
 * thousands separator can't silently skew the verdict 1000x.
 */

const BOUNDS = {
  km: { min: 1, max: 3000 },
  kmPerL: { min: 3, max: 60 },
  fuelPrice: { min: 5, max: 50 },
  saving: { min: 1, max: 100_000 },
}

const fmt = (n: number) =>
  n.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function GraensehandelCalculator() {
  const [km, setKm] = useState('100')
  const [kmPerL, setKmPerL] = useState('15')
  const [fuelPrice, setFuelPrice] = useState('17,69')
  const [saving, setSaving] = useState('')

  const kmN = parseDanishNumber(km, BOUNDS.km.min, BOUNDS.km.max)
  const kmlN = parseDanishNumber(kmPerL, BOUNDS.kmPerL.min, BOUNDS.kmPerL.max)
  const priceN = parseDanishNumber(fuelPrice, BOUNDS.fuelPrice.min, BOUNDS.fuelPrice.max)
  const savingN = parseDanishNumber(saving, BOUNDS.saving.min, BOUNDS.saving.max)

  const transport = (kmN / kmlN) * priceN
  const hasTransport = Number.isFinite(transport)
  const hasSaving = Number.isFinite(savingN)
  const net = hasTransport && hasSaving ? savingN - transport : NaN
  const paysOff = net > 0

  return (
    <div
      role="group"
      aria-label="Beregner: kan grænsehandelsturen betale sig"
      className="w-full max-w-[440px] rounded-[24px] px-5 pt-5 pb-5"
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: CARD_SHADOW, fontFamily: 'var(--font-onest)' }}
    >
      <CardHeader eyebrow="Beregner" title="Kan turen betale sig?" />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Kørsel tur-retur (km)">
          <input type="text" inputMode="decimal" className={inputCls} style={fieldStyle} value={km} onChange={(e) => setKm(e.target.value)} />
        </Field>
        <Field label="Bilens forbrug (km/l)">
          <input type="text" inputMode="decimal" className={inputCls} style={fieldStyle} value={kmPerL} onChange={(e) => setKmPerL(e.target.value)} />
        </Field>
        <Field label="Benzinpris (kr./l)">
          <input type="text" inputMode="decimal" className={inputCls} style={fieldStyle} value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} />
        </Field>
        <Field label="Forventet besparelse (kr.)">
          <input type="text" inputMode="decimal" placeholder="Jeres eget tal" className={inputCls} style={fieldStyle} value={saving} onChange={(e) => setSaving(e.target.value)} />
        </Field>
      </div>

      <div aria-live="polite">
        <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: MINT_WASH, border: `1px solid ${CARD_BORDER}` }}>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-light)' }}>
            Brændstof for turen
          </p>
          <p className="font-bold text-[17px]" style={{ color: TEAL }}>
            {hasTransport ? `Ca. ${fmt(transport)} kr.` : 'Udfyld kørsel, forbrug og pris'}
          </p>
          {hasTransport && (
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-dark)' }}>
              I skal spare mere end {fmt(transport)} kr. på indkøbet, før turen er tjent hjem. Tid og slid på
              bilen er ikke regnet med.
            </p>
          )}
        </div>

        {hasTransport && hasSaving && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: paysOff ? TEAL : AMBER.wash }}
          >
            <div className="min-w-0">
              <p style={{ fontSize: 11, color: paysOff ? ON_TEAL_MUTED : AMBER.ink, marginBottom: 1 }}>
                Besparelse minus brændstof
              </p>
              <p className="font-bold text-[17px] leading-tight" style={{ color: paysOff ? '#ffffff' : AMBER.ink }}>
                {paysOff ? (
                  <>
                    Ca. <span style={{ color: MINT }}>{fmt(net)} kr.</span> tilbage
                  </>
                ) : net === 0 ? (
                  'Det går præcis lige op'
                ) : (
                  `Turen koster ca. ${fmt(Math.abs(net))} kr. mere, end I sparer`
                )}
              </p>
            </div>
            <span
              className="shrink-0 font-semibold text-[11px] px-2 py-1"
              style={{ borderRadius: 8, background: paysOff ? MINT : 'transparent', border: paysOff ? 'none' : `1px solid ${AMBER.ink}`, color: paysOff ? TEAL : AMBER.ink }}
            >
              {paysOff ? 'På papiret: ja' : 'På papiret: nej'}
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-light)' }}>
        Benzinprisen er forudfyldt med Drivkraft Danmarks listepris for benzin (juli 2026). Justér den
        til jeres egen pris. Besparelsen er jeres eget skøn; beregneren tager ikke stilling til, hvad I
        kan spare ved grænsen. Intet gemmes, når I beregner.
      </p>
    </div>
  )
}
