// The site's shared reveal spring (slight overshoot on settle). One source of
// truth — Services, SavingsCounter and the carousel reveals must animate with
// the SAME curve, and string duplication let them drift silently.
export const REVEAL_SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)'
