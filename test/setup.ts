import '@testing-library/jest-dom/vitest'

// Node 26's web-storage integration makes jsdom leave window.localStorage
// undefined unless the process runs with --localstorage-file. Components
// treat a missing localStorage as "no flag" (try/catch), but tests need a
// working one to assert the flag behaviour — polyfill in-memory.
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(String(k)) ?? null,
      setItem: (k: string, v: string) => {
        store.set(String(k), String(v))
      },
      removeItem: (k: string) => {
        store.delete(String(k))
      },
      clear: () => {
        store.clear()
      },
      get length() {
        return store.size
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
    },
  })
}
