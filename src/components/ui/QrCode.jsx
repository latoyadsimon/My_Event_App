// A QR code drawn as SVG (qrcode-generator, no other dependencies).
//   <QrCode value="https://…/e/acme/rsvp" label="Scan to RSVP" size={160} />
// Dark modules on white with a quiet zone, so phones scan it on any theme.
import qrcode from 'qrcode-generator'

export default function QrCode({ value, label, size = 160, className }) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  const n = qr.getModuleCount()
  const margin = 4
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`
  return (
    <svg className={className} width={size} height={size} viewBox={`0 0 ${n + margin * 2} ${n + margin * 2}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  )
}
