// =====================================================================
// Photo booth, magnets and galleries (product Phase 3):
//   setup and the client's choices (PL-6.4, CL-3.7) · a booth session at
//   the kiosk (GU-5.3) · the attendant's printer, queue, reprints and
//   hidden photos (ST-4.4) · magnets from a phone or roaming staff
//   (GU-5.4) · uploads and recipes (GU-6.1) · the thank-you tracker
//   (CL-6.2) and the thank-you + gallery message (PL-8.4, P3).
// Privacy (NFR-14): a "kids in the photo" session shares nothing and its
// photos stay off the slideshow and the guest gallery.
// =====================================================================
import { nowStamp } from '../../lib/clock'
import { magnetsLeft } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName, isEmailContact } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const owner = (state) => state.team.find((m) => m.role === 'owner')
const setBooth = (state, eventId, changes) => ({ ...state, events: updateById(state.events, eventId, (e) => ({ booth: { ...e.booth, ...changes } })) })
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: `${firstName(owner(state)?.name)} (planner)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'planner' },
})
const hueFor = (n) => (n * 53 + 20) % 360

/** Print one item if the printer can; otherwise it waits ("held"). Paper and ink go down. */
function printOrHold(state, eventId, print) {
  const b = eventOf(state, eventId).booth
  const can = b.printer === 'ready' && b.paper >= print.copies
  let next = { ...state, prints: [...state.prints.filter((p) => p.id !== print.id), { ...print, status: can ? 'printed' : 'held', printedAt: can ? nowStamp() : null }] }
  if (can) next = setBooth(next, eventId, { paper: b.paper - print.copies, ink: Math.max(0, b.ink - print.copies) })
  if (can && b.paper - print.copies <= 0) next = setBooth(next, eventId, { printer: 'out' })
  return next
}

export const boothActions = {
  'booth/configure': (state, a) => setBooth(state, a.eventId, a.changes),
  'booth/setChoices': (state, a) => {
    const event = eventOf(state, a.eventId)
    const next = setBooth(state, event.id, { overlay: a.overlay, magnetFrame: a.magnetFrame })
    return withToast(pushToPlanner(next, 'Booth choices updated', `${event.name}: overlay and magnet frame picked`, `/app/events/${event.id}/logistics/entertainment`), 'Saved. Your booth will wear it.')
  },
  'booth/downloadOffline': (state, a) => withToast(setBooth(state, a.eventId, { offlineAt: nowStamp() }), 'Booth saved to the tablets for offline use'),
  // The tablet died: another device signs in and picks up the session (ST-4.4)
  'booth/takeOver': (state, a) => withToast(setBooth(state, a.eventId, { deviceId: a.deviceId }), 'This device is running the booth now. Nothing was lost.'),

  // ---- A kiosk session (GU-5.3): 3 shots, a strip printed, shared only if they opt in ----
  'booth/session': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event?.booth?.enabled) return state
    const sessionId = a.id ?? newId('bs')
    const base = state.photos.length
    const shots = Array.from({ length: 3 }, (_, i) => ({
      id: `${sessionId}-${i + 1}`, eventId: event.id, sessionId, source: 'booth', hue: hueFor(base + i), by: 'Photo booth', at: nowStamp(),
      hidden: Boolean(a.hideFromSlideshow) || Boolean(a.child), child: Boolean(a.child), src: null,
    }))
    const share = !a.child && a.share?.to?.trim() ? { channel: isEmailContact(a.share.to) ? 'email' : 'text', to: a.share.to.trim() } : null
    let next = { ...state, photos: [...state.photos, ...shots], boothSessions: [...state.boothSessions, { id: sessionId, eventId: event.id, at: nowStamp(), shared: share, child: Boolean(a.child), copies: event.booth.copies }] }
    next = printOrHold(next, event.id, { id: newId('pr'), eventId: event.id, photoId: shots[0].id, kind: 'strip', copies: Math.min(event.booth.copies, event.booth.printLimit), status: 'queued', at: nowStamp() })
    if (share) {
      next = withMessage(next, {
        type: share.channel === 'email' ? 'email' : 'sms', to: share.to, from: state.business.name, subject: `Your photos from ${event.name}`,
        body: 'Here are your booth photos! Download them any time from the gallery.', link: { label: 'See your photos', to: `/e/${event.id}/gallery?s=${sessionId}`, role: 'guest' },
      })
    }
    return next
  },

  // ---- The attendant (ST-4.4) ----
  // Jam or out of paper: printing pauses, the queue holds, the planner is told; fixing it prints what was held
  'booth/printer': (state, a) => {
    const event = eventOf(state, a.eventId)
    let next = setBooth(state, event.id, { printer: a.status })
    if (a.status !== 'ready') return pushToPlanner(withToast(next, a.status === 'jam' ? 'Printing paused: printer jam' : 'Printing paused: out of paper', 'warning'), `Booth printer ${a.status === 'jam' ? 'jammed' : 'is out of paper'}`, `${event.name}: prints are held until it's fixed.`, `/app/booth/${event.id}`)
    for (const p of state.prints.filter((x) => x.eventId === event.id && x.status === 'held')) next = printOrHold(next, event.id, p)
    return withToast(next, 'Printer ready. Held prints are printing.')
  },
  'booth/refill': (state, a) => {
    const b = eventOf(state, a.eventId).booth
    const next = setBooth(state, a.eventId, { paper: b.paper + (Number(a.paper) || 0), ink: a.ink ? 100 : b.ink, printer: b.printer === 'out' ? 'ready' : b.printer })
    return withToast(next, `Paper ${b.paper + (Number(a.paper) || 0)} sheets${a.ink ? ', ink full' : ''}`)
  },
  'booth/reprint': (state, a) => {
    const p = state.prints.find((x) => x.id === a.printId)
    return withToast(printOrHold(state, p.eventId, { ...p, id: newId('pr'), status: 'queued', at: nowStamp(), reprintOf: p.id }), 'Reprinting')
  },
  'photo/hide': (state, a) => ({ ...state, photos: updateById(state.photos, a.photoId, { hidden: a.hidden }) }),

  // ---- Magnets (GU-5.4): a phone photo (station QR) or roaming staff; picked up at the station ----
  'magnet/request': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event?.booth?.enabled || !event.booth.magnets) return state
    if (magnetsLeft(state, event.id) <= 0) return withToast(state, 'All the magnets for tonight are spoken for.', 'warning')
    const id = a.id ?? newId('mg')
    const next = {
      ...state,
      photos: [...state.photos, { id, eventId: event.id, sessionId: null, source: 'magnet', hue: hueFor(state.photos.length), by: a.by?.trim() || 'A guest', at: nowStamp(), hidden: false, child: false, src: a.src ?? null }],
      prints: [...state.prints, { id: newId('pr'), eventId: event.id, photoId: id, kind: 'magnet', copies: 1, status: 'queued', at: nowStamp(), crop: 'center' }],
    }
    return withToast(next, a.by ? `Thanks, ${firstName(a.by)}! Pick up your magnet at the booth in about 10 minutes.` : 'Magnet requested')
  },
  // The attendant picks the crop and prints it
  'magnet/print': (state, a) => {
    const p = state.prints.find((x) => x.id === a.printId)
    if (!p || p.status === 'printed') return state
    if (magnetsLeft(state, p.eventId) <= 0) return withToast(state, 'No magnets left', 'danger')
    return printOrHold(state, p.eventId, { ...p, crop: a.crop ?? p.crop })
  },

  // ---- After the event (GU-6.1, CL-6.1) ----
  'photo/upload': (state, a) => {
    const event = eventOf(state, a.eventId)
    const id = newId('up')
    const next = { ...state, photos: [...state.photos, { id, eventId: event.id, sessionId: null, source: 'guest', hue: hueFor(state.photos.length), by: a.by?.trim() || 'A guest', at: nowStamp(), hidden: false, child: false, src: a.src ?? null, name: a.name ?? null }] }
    return withToast(next, 'Added to the gallery. Thank you!')
  },
  'recipe/post': (state, a) => {
    if (!a.dish?.trim() || !a.text?.trim()) return state
    return withToast({ ...state, recipes: [...state.recipes, { id: newId('rc'), eventId: a.eventId, by: a.by?.trim() || 'A guest', dish: a.dish.trim(), text: a.text.trim(), at: nowStamp() }] }, 'Recipe posted. Everyone will thank you.')
  },
  'gallery/downloadAll': (state, a) => withToast({ ...state, events: updateById(state.events, a.eventId, { galleryZipAt: nowStamp() }) }, 'Your download is ready: full-resolution photos in one zip file'),

  // ---- Thank-yous (CL-6.2) and the thank-you + gallery message (PL-8.4, P3) ----
  'guest/setGift': (state, a) => ({ ...state, guests: updateById(state.guests, a.guestId, { gift: a.gift }) }),
  'guest/thankYou': (state, a) => ({ ...state, guests: updateById(state.guests, a.guestId, { thankYouAt: a.sent ? nowStamp() : null }) }),
  'guests/thankYouGallery': (state, a) => {
    const event = eventOf(state, a.eventId)
    const to = state.guests.filter((g) => g.eventId === event.id && !g.removed && (g.rsvp === 'attending' || g.checkedIn) && (g.phone || g.email) && g.invite !== 'stopped')
    let next = state
    for (const g of to) {
      next = withMessage(next, {
        type: g.phone ? 'sms' : 'email', to: `${g.name} · ${g.phone || g.email}`, from: state.business.name, subject: `Thank you for coming to ${event.name}`,
        body: `Thank you for celebrating with us! Your photos are in the gallery${event.booth?.galleryExpires ? ' (download them before it closes)' : ''}. Add yours too.`,
        link: { label: 'See the gallery', to: `/e/${event.id}/gallery?t=${g.token}`, role: 'guest' },
      })
    }
    next = { ...next, events: updateById(next.events, event.id, { thankYouSentAt: nowStamp() }) }
    return withToast(next, `Thank-you and gallery link sent to ${to.length} guest${to.length === 1 ? '' : 's'}`)
  },
}
