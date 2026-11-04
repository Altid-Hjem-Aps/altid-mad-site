// Shared colour/easing tokens for the problem sections. Split out of
// problemShared.tsx so light consumers (ProblemIntro is server-rendered on
// the homepage) don't pull framer-motion into the first-load bundle.

export const TEAL = '#3E6924'
export const FOREST = '#163223'
export const MUTED = '#6f6a61'

export const EASE_EXPO = [0.16, 1, 0.3, 1] as const
