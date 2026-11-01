// =====================================================================
// Read-only helpers for the photo booth, magnets and galleries
// (product Phase 3). Re-exported from selectors.js.
// =====================================================================
import { daysUntil } from '../lib/clock'

const eventOf = (state, id) => state.events.find((e) => e.id === id)

/** Photos for a place: 'slideshow' (not hidden, no kids), 'gallery' (no kids' shots), 'all' (attendant, client). */
export function getPhotos(state, eventId, view = 'gallery') {
  const list = state.photos.filter((p) => p.eventId === eventId && !p.removed)
  const shown = view === 'all' ? list : view === 'slideshow' ? list.filter((p) => !p.hidden && !p.child) : list.filter((p) => !p.child)
  return [...shown].sort((a, b) => b.at.localeCompare(a.at))
}

/** Waiting to print: held strips (printer jam / out of paper) and magnets to pick and crop. */
export const printQueue = (state, eventId) => state.prints.filter((p) => p.eventId === eventId && (p.status === 'queued' || p.status === 'held'))
  .sort((a, b) => a.at.localeCompare(b.at))

export function magnetsLeft(state, eventId) {
  const event = eventOf(state, eventId)
  const used = state.prints.filter((p) => p.eventId === eventId && p.kind === 'magnet' && p.status === 'printed').length
  return Math.max(0, (event.booth?.magnets ?? 0) - used)
}

/** Booth numbers (live panel PL-7.2, report PL-8.5). */
export function boothStats(state, eventId) {
  const sessions = state.boothSessions.filter((s) => s.eventId === eventId)
  const printed = state.prints.filter((p) => p.eventId === eventId && p.status === 'printed')
  return {
    sessions: sessions.length,
    prints: printed.filter((p) => p.kind === 'strip').reduce((t, p) => t + p.copies, 0),
    magnets: printed.filter((p) => p.kind === 'magnet').length,
    shared: sessions.filter((s) => s.shared).length,
    photos: state.photos.filter((p) => p.eventId === eventId && !p.removed).length,
    waiting: printQueue(state, eventId).length,
  }
}

/** 'open' | 'private' (needs the guest's link) | 'expired' (CL-6.1, NFR-14) */
export function galleryAccess(event, hasLink) {
  if (event.booth?.galleryExpires && daysUntil(event.booth.galleryExpires) < 0) return 'expired'
  if (event.booth?.galleryPrivate && !hasLink) return 'private'
  return 'open'
}

/** CL-6.2: guests with a gift noted, and whether the thank-you went out. */
export const thankYouList = (state, eventId) => state.guests
  .filter((g) => g.eventId === eventId && !g.removed && g.gift?.trim())
  .sort((a, b) => Number(Boolean(a.thankYouAt)) - Number(Boolean(b.thankYouAt)) || a.name.localeCompare(b.name))
