// Shared colour/easing tokens for the problem sections. Split out of
// problemShared.tsx so light consumers (ProblemIntro is server-rendered on
// the homepage) don't pull the whole flow kit — and framer-motion with it —
// into the first-load bundle.

export const TEAL = '#3E6924'
export const MINT = '#DCD799'
export const FOREST = '#163223'
export const MUTED = '#6f6a61'
export const HAIRLINE = 'rgba(62,105,36,0.12)'

export const EASE_EXPO = [0.16, 1, 0.3, 1] as const
export const EASE_QUINT = [0.22, 1, 0.36, 1] as const
