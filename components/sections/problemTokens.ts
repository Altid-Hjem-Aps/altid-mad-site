// Shared colour/easing tokens for the problem sections. Split out of
// problemShared.tsx so light consumers (ProblemIntro is server-rendered on
// the homepage) don't pull the whole flow kit — and framer-motion with it —
// into the first-load bundle.

export const TEAL = '#0f6e68'
export const MINT = '#bfe6e0'
export const FOREST = '#163223'
export const MUTED = '#6f6a61'
export const HAIRLINE = 'rgba(15,110,104,0.12)'

export const ACCENT = {
  blue: { wash: 'rgba(47,143,208,0.13)', ink: '#1c567e', dot: '#2f8fd0' },
  amber: { wash: 'rgba(232,139,47,0.15)', ink: '#7d430e', dot: '#e88b2f' },
  brand: { wash: 'rgba(15,110,104,0.1)', ink: TEAL, dot: TEAL },
}

// The savings tone: a mid-teal that reads clearly on the beige screen — used
// for "+X kr." savings figures across the phone mockups.
export const SAVE_TEAL = '#3d9187'

export const EASE_EXPO = [0.16, 1, 0.3, 1] as const
export const EASE_QUINT = [0.22, 1, 0.36, 1] as const
