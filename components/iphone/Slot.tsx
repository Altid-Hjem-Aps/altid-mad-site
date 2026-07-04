// Slot-machine text swap used by the phone screens' hover states: two stacked
// values in a 1-line window, rolled by translateY. Shared by the Mad screens
// (was inlined in the old Hjem HomeScreen).
export default function Slot({ from, to, hovered, h = 20 }: { from: string; to: string; hovered: boolean; h?: number }) {
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', height: h, verticalAlign: 'middle' }}>
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: hovered ? 'translateY(-50%)' : 'translateY(0%)',
          transition: 'transform 0.85s cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      >
        <span style={{ height: h, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{from}</span>
        <span style={{ height: h, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{to}</span>
      </span>
    </span>
  )
}
