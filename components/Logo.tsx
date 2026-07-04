const PATHS_ALTID = [
  "M186.61,311.72v-25.28h-.84c-10.11,20.64-37.91,33.28-68.66,33.28C48.02,319.73,0,265.38,0,194.61s50.13-124.69,117.11-124.69c28.64,0,55.18,11.37,68.66,32.86h.84v-24.85h69.93v233.79h-69.93ZM186.61,194.61c0-32.86-26.54-59.39-59.4-59.39s-57.29,26.54-57.29,60.24,25.7,58.98,58.13,58.98,58.55-26.12,58.55-59.82Z",
  "M309.6,311.72V0h69.93v311.72h-69.93Z",
  "M443.98,311.72v-180.71h-34.54v-53.08h34.54V0h69.93v77.93h33.7v53.08h-33.7v180.71h-69.93Z",
  "M577.93,53.08V0h69.93v53.08h-69.93ZM577.93,311.72V77.93h69.93v233.79h-69.93Z",
  "M875.33,311.72v-25.28h-.84c-13.06,21.48-36.65,32.86-69.93,32.86-70.77,0-117.11-54.34-117.11-125.11s47.6-124.27,115.84-124.27c26.96,0,48.86,8,68.66,27.8V0h69.93v311.72h-66.56ZM875.75,193.77c0-32.44-24.85-58.55-59.4-58.55s-58.98,24.43-58.98,58.55,24.85,60.24,58.55,60.24,59.82-25.7,59.82-60.24Z",
]

const PATHS_HJEM = [
  "M628.59,465.71v-48.37c0-19.12-7.39-27.8-22.18-27.8s-23.46,10.61-23.46,27.96v48.21h-16.71v-118.92h16.71v39.37h.32c5.3-7.88,13.82-11.89,24.91-11.89,21.21,0,37.12,13.5,37.12,37.93v53.51h-16.71Z",
  "M657.35,483.23c6.59-.64,11.09-2.57,11.09-16.23v-90.31h16.71v94.81c0,19.29-16.87,29.25-27.8,29.25v-17.51ZM668.44,366.4v-19.6h16.71v19.6h-16.71Z",
  "M718.58,428.43c3.86,14.79,15.59,24.27,29.25,24.27,10.44,0,20.25-5.46,25.39-14.94h16.71c-6.91,18.32-23.62,30.21-42.75,30.21-25.07,0-45.32-22.18-45.32-45.96,0-28.12,21.21-47.73,44.84-47.73,26.19,0,46.12,20.25,46.12,45.8,0,2.73,0,5.3-.48,8.36h-73.76ZM776.11,415.57c-1.28-15.11-14.62-26.03-28.93-26.03s-27.32,10.77-28.6,26.03h57.53Z",
  "M927.48,465.71v-49.82c0-16.88-7.07-26.36-21.05-26.36-14.78,0-21.21,8.2-21.21,26.03v50.14h-16.71v-51.74c0-17.52-8.2-24.43-20.25-24.43-14.78,0-22.02,8.68-22.02,26.19v49.98h-16.71v-89.03h15.43v9.64h.32c7.23-8.52,13.98-12.05,25.55-12.05s23.14,5.63,27.64,14.94c6.43-10.12,15.27-14.94,29.41-14.94,23.14,0,36.32,14.46,36.32,37.44v53.99h-16.71Z",
]

// "altid mad" lockup for the Mad site: the "altid" letter paths (cropped to
// the word's own height) with the subbrand word set in Afacad below-right,
// like the Services card lockups. `size` is the total lockup height in px.
export function MadLogo({ className, style, size = 44, altidColor = '#fff', madColor = '#bfe6e0' }: {
  className?: string
  style?: React.CSSProperties
  size?: number
  altidColor?: string
  madColor?: string
}) {
  return (
    <span className={`inline-flex flex-col items-end ${className ?? ''}`} style={{ gap: size * 0.06, ...style }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 944.2 319.73"
        style={{ height: size * 0.6, width: 'auto' }}
        aria-hidden
      >
        {PATHS_ALTID.map((d, i) => <path key={i} fill={altidColor} d={d} />)}
      </svg>
      <span
        className="leading-none"
        style={{ fontFamily: 'var(--font-afacad)', color: madColor, fontSize: size * 0.34 }}
      >
        mad
      </span>
    </span>
  )
}

export function Logo({ className, style, variant = 'default' }: {
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'dark' | 'white' | 'forest'
}) {
  // 'forest' = wordmark on the deep-green nav bar: white "altid" + signal-green "hjem".
  const altidColor = variant === 'white' || variant === 'forest' ? '#fff' : '#003c16'
  const hjemColor =
    variant === 'forest' ? '#90ff7c'
      : variant === 'white' ? '#fff'
      : variant === 'dark' ? '#003c16'
      : '#aff193'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 944.2 500.74"
      className={className}
      style={style}
    >
      {PATHS_ALTID.map((d, i) => <path key={i} fill={altidColor} d={d} />)}
      {PATHS_HJEM.map((d, i) => <path key={i} fill={hjemColor} d={d} />)}
    </svg>
  )
}
