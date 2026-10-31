// =====================================================================
// The demo clock. Every screen asks this file what "today" is, so the
// whole app agrees: Thu Nov 5, 2026, 6:00 PM (the evening Ana books).
// When the real backend arrives, TODAY becomes `new Date()`.
//
// Dates without a time ("2027-06-12") are calendar days. We read them as
// LOCAL days on purpose: new Date('2027-06-12') would be UTC midnight,
// which shows as Jun 11 in the US.
// =====================================================================

export const TODAY = new Date(2026, 10, 5, 18, 0) // months count from 0, so 10 = November

const DAY_MS = 24 * 60 * 60 * 1000

/** '2027-06-12' → a Date at local midnight. Full date-times pass straight through. */
export function parseDay(value) {
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

/** Whole calendar days from today to the given day (negative = in the past). */
export function daysUntil(value) {
  const start = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
  const end = parseDay(value)
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((endDay - start) / DAY_MS)
}

/** Sat, Jun 12, 2027 */
export const formatDay = (value) =>
  parseDay(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

/** Jun 12 */
export const formatDayShort = (value) =>
  parseDay(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** Nov 5, 4:12 PM */
export const formatDateTime = (value) => {
  const d = parseDay(value)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day}, ${time}`
}

/** A timestamp for "now" in the demo, as an ISO-like local string the formatters understand. */
export function nowStamp() {
  const p = (n) => String(n).padStart(2, '0')
  const d = TODAY
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}
