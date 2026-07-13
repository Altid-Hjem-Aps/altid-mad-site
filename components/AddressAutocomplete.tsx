'use client'

import { useState, useEffect, useRef } from 'react'

interface DawaResult { tekst: string; type: string }

interface Props {
  value: string
  onChange: (value: string) => void
  variant?: 'light' | 'dark'
  compact?: boolean
}

export default function AddressAutocomplete({ value, onChange, variant = 'light', compact = false }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<DawaResult[]>([])
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function calcDropPos() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
  }

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(query)}&type=adresse&per_side=5`)
        const data: DawaResult[] = await res.json()
        setResults(data)
        if (data.length > 0) { calcDropPos(); setOpen(true) }
      } catch { setResults([]) }
    }, 300)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('scroll', () => open && calcDropPos(), true)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  function select(tekst: string) {
    setQuery(tekst)
    onChange(tekst)
    setOpen(false)
  }

  const isDark = variant === 'dark'

  return (
    <div ref={wrapperRef} className="relative">
      {!compact && (
        <label
          className="block text-xs font-medium mb-1.5 tracking-widest uppercase"
          style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'var(--text-mid)' }}
        >
          Adresse
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value) }}
        onFocus={() => { calcDropPos(); results.length > 0 && setOpen(true) }}
        placeholder="Din adresse..."
        autoComplete="street-address"
        className={`w-full text-[15px] outline-none ${isDark ? 'placeholder:text-white/40' : 'placeholder:text-[#aaa]'} ${compact ? '' : 'px-4 py-3 rounded-[10px] border-[1.5px]'}`}
        style={compact
          ? { padding: '0 16px', height: 52, background: 'transparent', color: isDark ? 'white' : 'var(--text-dark)', fontFamily: 'var(--font-onest)' }
          : {
              background: isDark ? 'rgba(255,255,255,0.08)' : 'white',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(62,105,36,0.15)',
              color: isDark ? 'white' : 'var(--text-dark)',
              fontFamily: 'var(--font-onest)',
            }
        }
      />

      {/* Dropdown uses position:fixed to escape any overflow:hidden ancestor */}
      {open && results.length > 0 && (
        <ul
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
            background: 'white',
            border: '1px solid rgba(62,105,36,0.1)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          }}
        >
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => select(r.tekst)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-cream transition-colors"
                style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-onest)' }}
              >
                {r.tekst}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
