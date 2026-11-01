// =====================================================================
// The planner's brand color on client and guest pages (NFR-15), kept readable.
// Style guide §12: if the brand color is under 4.5:1 against white, we use a
// darker "ink" version of it for text and buttons, so any color a planner
// picks still passes WCAG AA.
// =====================================================================
import { contrast } from '../styles/contrast'

const toHex = (n) => Math.round(n).toString(16).padStart(2, '0')

/** Mix a #RRGGBB color toward black by `amount` (0 = unchanged, 1 = black). */
export function darken(hex, amount) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) * (1 - amount))
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export const isHexColor = (v) => /^#[0-9A-Fa-f]{6}$/.test(v)

/** The brand color itself if white text on it reads well (≥ 4.5:1); otherwise a darker shade that does. */
export function brandInk(hex) {
  if (!isHexColor(hex)) return '#2E1A3A'
  let ink = hex.toUpperCase()
  for (let step = 1; contrast(ink, '#FFFFFF') < 4.5 && step <= 20; step++) ink = darken(hex, step * 0.05)
  return ink
}
