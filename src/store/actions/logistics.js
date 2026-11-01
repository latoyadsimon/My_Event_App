// =====================================================================
// Logistics (product Phase 2): vendors on an event and the vendor portal,
// the run-of-show, the budget, gear reservations and the pack list, and
// the "Final week" status that sends final details to everyone.
// Vendor-side actions (confirm, upload, acknowledge, arrived) are here too,
// because they change the same rows the planner sees.
// =====================================================================
import { formatDay, nowStamp, daysUntil } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { getEventGuests, formatClock, hhmm, minutesOf, getItem } from '../selectors'
import { TIMELINE_TEMPLATES } from '../../data/seedLogistics'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const evOf = (state, id) => state.eventVendors.find((x) => x.id === id)
const vendorOf = (state, ev) => state.vendors.find((v) => v.id === ev.vendorId)
const owner = (state) => state.team.find((m) => m.role === 'owner')
const withLog = (state, eventId, text) => ({
  ...state, events: updateById(state.events, eventId, (e) => ({ log: [...(e.log ?? []), { at: nowStamp(), text }] })),
})
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: `${firstName(owner(state)?.name)} (planner)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'planner' },
})
/** Email (or text) a vendor with their magic link (VN-1: no account, the link is the key). */
const toVendor = (state, ev, subject, body, label = 'Open your event page') => {
  const v = vendorOf(state, ev)
  return withMessage(state, {
    type: v.email ? 'email' : 'sms', to: `${v.name} · ${v.email || v.phone}`, from: state.business.name, subject, body,
    link: { label, to: `/v/${ev.token}`, role: 'vendor' }, foot: 'This link is just for you and expires in 7 days.',
  })
}
const vendorsPath = (eventId) => `/app/events/${eventId}/logistics/vendors`

/**
 * A "what changed" notice for vendors (VN-4). Only vendors still booked; `only` limits it
 * to some. A change inside a vendor's cutoff is marked "past your cutoff".
 */
export function notifyVendors(state, eventId, text, only) {
  const event = eventOf(state, eventId)
  let next = state
  for (const ev of state.eventVendors.filter((x) => x.eventId === eventId && x.status !== 'cancelled' && (!only || only.includes(x.id)))) {
    const change = { id: newId('ch'), at: nowStamp(), text, acknowledgedAt: null, pastCutoff: daysUntil(event.date) <= ev.cutoffDays }
    next = { ...next, eventVendors: updateById(next.eventVendors, ev.id, (x) => ({ changes: [...x.changes, change] })) }
    next = toVendor(next, ev, `What changed: ${event.name}`, `${text}${change.pastCutoff ? ' This is past your cutoff; please acknowledge it.' : ' Please acknowledge it on your event page.'}`, 'See what changed')
  }
  return next
}

/** Reserve the gear behind proposal lines (kits for booth/karaoke, chairs by count). PL-6.2 */
export function reserveFromLines(state, eventId, lines) {
  const rows = []
  for (const line of lines) {
    const kit = state.kits.find((k) => k.addonId === line.addonId)
    if (kit) for (const [itemId, qty] of kit.items) rows.push({ itemId, qty: qty * line.qty, kitId: kit.id })
    else if (getItem(state, line.addonId)) rows.push({ itemId: line.addonId, qty: line.qty, kitId: null })
  }
  return { ...state, reservations: [...state.reservations, ...rows.map((r) => ({ id: newId('r'), eventId, partner: null, ...r }))] }
}

export const logisticsActions = {
  // ---- Vendor directory (PL-4.10) ----
  'vendor/save': (state, a) => {
    const v = a.vendor
    if (v.id && state.vendors.some((x) => x.id === v.id)) return { ...state, vendors: updateById(state.vendors, v.id, v) }
    return withToast({ ...state, vendors: [...state.vendors, { rating: null, coiExpiresOn: null, w9: false, payout: '', profileComplete: false, ...v, id: newId('vendor') }] }, `${v.name} added to your directory`)
  },

  // Private to the planner: vendors never see it (VN-8)
  'vendor/rate': (state, a) => {
    const ev = evOf(state, a.eventVendorId)
    let next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, { rating: { stars: a.stars, note: a.note?.trim() ?? '', at: nowStamp() } }) }
    const scores = next.eventVendors.filter((x) => x.vendorId === ev.vendorId && x.rating).map((x) => x.rating.stars)
    next = { ...next, vendors: updateById(next.vendors, ev.vendorId, { rating: Math.round(scores.reduce((t, n) => t + n, 0) / scores.length) }) }
    return withToast(next, 'Rating saved (only your team sees it)')
  },

  // ---- Vendors on an event ----
  'eventVendor/add': (state, a) => {
    const event = eventOf(state, a.eventId)
    const vendor = state.vendors.find((v) => v.id === a.vendorId)
    if (!event || !vendor) return state
    const ev = {
      id: newId('ev'), eventId: event.id, vendorId: vendor.id, token: newId('v'), status: 'invited', invitedAt: nowStamp(), confirmedAt: null,
      arrival: a.arrival || '', area: a.area?.trim() ?? '', amountCents: a.amountCents ?? 0, dueDate: event.date, cutoffDays: 7,
      notes: a.notes?.trim() ?? '', docs: [], payments: [], changes: [], arrivedAt: null, rating: null,
    }
    let next = {
      ...state,
      eventVendors: [...state.eventVendors, ev],
      threads: [...state.threads, { id: newId('th'), eventId: event.id, kind: 'vendor', eventVendorId: ev.id, name: vendor.name, shared: false, messages: [] }],
    }
    if (ev.amountCents && !state.budgetLines.some((b) => b.eventId === event.id && b.category === vendor.category)) {
      next = { ...next, budgetLines: [...next.budgetLines, { id: newId('b'), eventId: event.id, category: vendor.category, estimatedCents: ev.amountCents, actualCents: 0, eventVendorId: ev.id }] }
    }
    next = toVendor(next, ev, `${state.business.name} booked you for ${event.name}`,
      `${formatDay(event.date)} at ${event.venue}. Open your event page to ${vendor.profileComplete ? 'see your part and confirm' : 'add your company details, insurance and W-9 (once; we reuse them next time), then confirm'}.`)
    return withToast(withLog(next, event.id, `${vendor.name} invited`), `Invite sent to ${vendor.name}`)
  },

  'eventVendor/update': (state, a) => ({ ...state, eventVendors: updateById(state.eventVendors, a.id, a.changes) }),

  'eventVendor/remindCoi': (state, a) => {
    const ev = evOf(state, a.id)
    const event = eventOf(state, ev.eventId)
    const next = toVendor(state, ev, 'Insurance certificate needed', `Please upload a certificate of insurance (COI) that's valid through ${formatDay(event.date)}.`, 'Upload your COI')
    return withToast(next, `Reminder sent to ${vendorOf(state, ev).name}`)
  },

  'eventVendor/remindAck': (state, a) => {
    const ev = evOf(state, a.id)
    const n = ev.changes.filter((c) => !c.acknowledgedAt).length
    const next = toVendor(state, ev, `Reminder: ${n} change${n > 1 ? 's' : ''} to acknowledge`, 'Please open your event page and tap Acknowledge so we know you saw the update.', 'See what changed')
    return withToast(next, `Reminder sent to ${vendorOf(state, ev).name}`)
  },

  // The vendor (from their page) or the planner marks a vendor as cancelled; the planner sees replacements
  'eventVendor/cancel': (state, a) => {
    const ev = evOf(state, a.id)
    const event = eventOf(state, ev.eventId)
    const name = vendorOf(state, ev).name
    let next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, { status: 'cancelled', cancelledAt: nowStamp(), cancelReason: a.reason?.trim() ?? '' }) }
    next = withLog(next, event.id, `${name} cancelled${a.reason ? ` (${a.reason.trim()})` : ''}`)
    if (a.by === 'vendor') next = pushToPlanner(next, `${name} cancelled`, `${event.name} · ${formatDay(event.date)}. See who else is free that day.`, vendorsPath(event.id))
    return withToast(next, a.by === 'vendor' ? 'We let the planner know.' : `${name} marked as cancelled`, a.by === 'vendor' ? 'success' : 'warning')
  },

  // Book a replacement: same arrival, area, notes and timeline items
  'eventVendor/replace': (state, a) => {
    const old = evOf(state, a.id)
    let next = logisticsActions['eventVendor/add'](state, { eventId: old.eventId, vendorId: a.vendorId, arrival: old.arrival, area: old.area, notes: old.notes, amountCents: a.amountCents ?? old.amountCents })
    const fresh = next.eventVendors.at(-1)
    next = { ...next, timeline: next.timeline.map((t) => (t.owner === `v:${old.id}` ? { ...t, owner: `v:${fresh.id}` } : t)) }
    next = { ...next, budgetLines: next.budgetLines.map((b) => (b.eventVendorId === old.id ? { ...b, eventVendorId: fresh.id, actualCents: 0 } : b)) }
    return next
  },

  // VN-7 (P2): the planner records a payment; the vendor gets a receipt
  'eventVendor/recordPayment': (state, a) => {
    const ev = evOf(state, a.id)
    if (!a.amountCents || a.amountCents <= 0) return state
    let next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, (x) => ({ payments: [...x.payments, { id: newId('vp'), at: nowStamp(), amountCents: a.amountCents, method: a.method }] })) }
    next = toVendor(next, ev, `Payment sent: ${formatMoney(a.amountCents)}`, `${state.business.name} paid you ${formatMoney(a.amountCents)} by ${a.method} for ${eventOf(state, ev.eventId).name}.`, 'See your payments')
    return withToast(next, `Recorded ${formatMoney(a.amountCents)} to ${vendorOf(state, ev).name}`)
  },

  'eventVendor/sharePhotos': (state, a) => {
    const ev = evOf(state, a.id)
    const next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, { photosSharedAt: nowStamp() }) }
    return withToast(toVendor(next, ev, 'Photos of your work', `Thanks for ${eventOf(state, ev.eventId).name}! ${state.business.name} shared photos from the event.`, 'See the photos'), 'Photos shared')
  },

  // ---- The vendor's side (VN-1 to VN-6) ----
  // First time only: company info, contacts, COI with expiry, W-9, payout. Reused next time.
  'vendor/setupProfile': (state, a) => {
    const ev = evOf(state, a.id)
    const p = a.profile
    const next = {
      ...state,
      vendors: updateById(state.vendors, ev.vendorId, { contact: p.contact.trim(), email: p.email.trim(), phone: p.phone.trim(), coiExpiresOn: p.coiExpiresOn, w9: true, payout: p.payout.trim(), profileComplete: true }),
      eventVendors: updateById(state.eventVendors, ev.id, (x) => ({
        docs: [...x.docs, { id: newId('d'), name: p.coiFile, kind: 'coi', at: nowStamp() }, { id: newId('d'), name: p.w9File, kind: 'w9', at: nowStamp() }],
      })),
    }
    return withToast(next, 'Saved. We\'ll reuse these next time.')
  },

  'eventVendor/upload': (state, a) => {
    const ev = evOf(state, a.id)
    let next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, (x) => ({ docs: [...x.docs, { id: newId('d'), name: a.name, kind: a.kind, at: nowStamp() }] })) }
    if (a.kind === 'coi' && a.expiresOn) next = { ...next, vendors: updateById(next.vendors, ev.vendorId, { coiExpiresOn: a.expiresOn }) }
    return withToast(next, `${a.name} uploaded`)
  },

  'eventVendor/confirm': (state, a) => {
    const ev = evOf(state, a.id)
    if (ev.status !== 'invited') return state
    const event = eventOf(state, ev.eventId)
    const name = vendorOf(state, ev).name
    let next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, { status: 'confirmed', confirmedAt: nowStamp() }) }
    next = pushToPlanner(withLog(next, event.id, `${name} confirmed`), `${name} confirmed`, `${event.name} · ${formatDay(event.date)}`, vendorsPath(event.id))
    return withToast(next, 'Confirmed. The planner can see it now.')
  },

  'eventVendor/acknowledge': (state, a) => {
    const ev = evOf(state, a.id)
    const next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, (x) => ({ changes: x.changes.map((c) => (c.acknowledgedAt ? c : { ...c, acknowledgedAt: nowStamp() })) })) }
    return withToast(next, 'Thanks! The planner can see you acknowledged.')
  },

  'eventVendor/arrived': (state, a) => {
    const ev = evOf(state, a.id)
    if (ev.arrivedAt) return state
    const event = eventOf(state, ev.eventId)
    const name = vendorOf(state, ev).name
    const next = { ...state, eventVendors: updateById(state.eventVendors, ev.id, { arrivedAt: nowStamp(), arrivedBy: a.by ?? 'vendor' }) }
    return a.by === 'staff' ? withToast(next, `${name} marked as arrived`)
      : withToast(pushToPlanner(next, `${name} arrived`, `${event.name} · load-in`, `/app/events/${event.id}/logistics/vendors`), 'Arrival recorded')
  },

  // VN-5: the vendor's own thread with the planner (made on first message if needed)
  'thread/postVendor': (state, a) => {
    const ev = evOf(state, a.eventVendorId)
    if (!ev || !a.text?.trim()) return state
    const name = vendorOf(state, ev).name
    let next = state
    let thread = state.threads.find((t) => t.eventVendorId === ev.id)
    if (!thread) {
      thread = { id: newId('th'), eventId: ev.eventId, kind: 'vendor', eventVendorId: ev.id, name, shared: false, messages: [] }
      next = { ...next, threads: [...next.threads, thread] }
    }
    next = { ...next, threads: updateById(next.threads, thread.id, (t) => ({ messages: [...t.messages, { id: newId('msg'), from: 'vendor', author: name, at: nowStamp(), text: a.text.trim(), attachment: a.attachment ?? null }] })) }
    return pushToPlanner(next, `Message from ${name}`, a.text.trim(), `/app/events/${ev.eventId}/messages?t=${thread.id}`)
  },

  // ---- Run-of-show (PL-4.11) ----
  'timeline/add': (state, a) => {
    if (!a.title?.trim() || !a.time) return state
    const item = { id: newId('ro'), eventId: a.eventId, time: a.time, minutes: Number(a.minutes) || 15, title: a.title.trim(), owner: a.owner, location: a.location?.trim() ?? '', notes: a.notes?.trim() ?? '', visibility: a.visibility ?? ['staff'], done: false }
    let next = { ...state, timeline: [...state.timeline, item] }
    if (item.owner?.startsWith('v:')) next = notifyVendors(next, a.eventId, `New on your timeline: ${formatClock(item.time)} ${item.title}.`, [item.owner.slice(2)])
    return next
  },

  'timeline/update': (state, a) => {
    const before = state.timeline.find((t) => t.id === a.id)
    let next = { ...state, timeline: updateById(state.timeline, a.id, a.changes) }
    const after = next.timeline.find((t) => t.id === a.id)
    const moved = before.time !== after.time || before.title !== after.title
    if (after.owner?.startsWith('v:') && (moved || before.owner !== after.owner)) {
      next = notifyVendors(next, after.eventId, `Timeline update: ${after.title} is now at ${formatClock(after.time)}${moved && before.time !== after.time ? ` (was ${formatClock(before.time)})` : ''}.`, [after.owner.slice(2)])
    }
    return next
  },

  'timeline/remove': (state, a) => ({ ...state, timeline: updateById(state.timeline, a.id, { removed: true }) }),
  'timeline/restore': (state, a) => ({ ...state, timeline: updateById(state.timeline, a.id, { removed: false }) }),

  'timeline/applyTemplate': (state, a) => {
    const event = eventOf(state, a.eventId)
    const rows = TIMELINE_TEMPLATES[a.template] ?? TIMELINE_TEMPLATES.default
    const start = minutesOf(event.startTime ?? '17:00')
    const me = owner(state)?.id
    const items = rows.map(([offset, title, minutes]) => ({
      id: newId('ro'), eventId: event.id, time: hhmm(start + offset), minutes, title, owner: me, location: '', notes: '',
      visibility: offset < 0 ? ['staff'] : ['client', 'vendor', 'staff'], done: false,
    }))
    return withToast({ ...state, timeline: [...state.timeline, ...items] }, `Added ${items.length} timeline items`)
  },

  // ---- Budget (PL-4.9) ----
  'budget/add': (state, a) => {
    if (!a.category?.trim()) return state
    return { ...state, budgetLines: [...state.budgetLines, { id: newId('b'), eventId: a.eventId, category: a.category.trim(), estimatedCents: a.estimatedCents ?? 0, actualCents: a.actualCents ?? 0, eventVendorId: a.eventVendorId ?? null }] }
  },
  'budget/update': (state, a) => ({ ...state, budgetLines: updateById(state.budgetLines, a.id, a.changes) }),
  'budget/remove': (state, a) => ({ ...state, budgetLines: state.budgetLines.filter((b) => b.id !== a.id) }),

  // ---- Gear (PL-6.2) ----
  'equipment/save': (state, a) => {
    const item = a.item
    if (item.id && state.equipment.some((x) => x.id === item.id)) return { ...state, equipment: updateById(state.equipment, item.id, item) }
    return withToast({ ...state, equipment: [...state.equipment, { wearCents: 0, label: '', ...item, id: newId('gear') }] }, `${item.name} added`)
  },
  'kit/save': (state, a) => {
    const kit = a.kit
    if (kit.id && state.kits.some((x) => x.id === kit.id)) return { ...state, kits: updateById(state.kits, kit.id, kit) }
    return withToast({ ...state, kits: [...state.kits, { addonId: null, ...kit, id: newId('kit') }] }, `${kit.name} created`)
  },

  // Reserving a kit reserves every piece in it
  'gear/reserveKit': (state, a) => {
    const kit = state.kits.find((k) => k.id === a.kitId)
    return withToast({ ...state, reservations: [...state.reservations, ...kit.items.map(([itemId, qty]) => ({ id: newId('r'), eventId: a.eventId, itemId, qty, kitId: kit.id, partner: null }))] }, `${kit.name} reserved`)
  },
  'gear/reserve': (state, a) => {
    if (!a.qty || a.qty < 1) return state
    const existing = state.reservations.find((r) => r.eventId === a.eventId && r.itemId === a.itemId && !r.kitId)
    if (existing) return { ...state, reservations: updateById(state.reservations, existing.id, { qty: existing.qty + a.qty }) }
    return { ...state, reservations: [...state.reservations, { id: newId('r'), eventId: a.eventId, itemId: a.itemId, qty: a.qty, kitId: null, partner: null }] }
  },
  'gear/release': (state, a) => {
    const r = state.reservations.find((x) => x.id === a.id)
    if (!r) return state
    return { ...state, reservations: state.reservations.filter((x) => (r.kitId ? !(x.eventId === r.eventId && x.kitId === r.kitId) : x.id !== r.id)) }
  },
  // A shortage is covered by renting the difference from a partner
  'gear/addPartner': (state, a) => {
    const r = state.reservations.find((x) => x.id === a.id)
    const next = { ...state, reservations: updateById(state.reservations, r.id, { partner: { name: a.name, qty: (r.partner?.qty ?? 0) + a.qty } }) }
    return withToast(next, `Renting ${a.qty} from ${a.name}`)
  },

  // ---- Pack list (PL-6.3); staff scan into the van in their app ----
  'pack/set': (state, a) => ({ ...state, events: updateById(state.events, a.eventId, (e) => ({ packed: { ...(e.packed ?? {}), [a.key]: a.status } })) }),
  'pack/addExtra': (state, a) => {
    if (!a.name?.trim()) return state
    return { ...state, events: updateById(state.events, a.eventId, (e) => ({ packExtras: [...(e.packExtras ?? []), { id: newId('x'), name: a.name.trim(), qty: Number(a.qty) || 1 }] })) }
  },

  // ---- Final week (PL-6.5): final details to client, vendors, staff and guests ----
  'event/startFinalWeek': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || !['booked', 'in_planning'].includes(event.status)) return state
    const client = state.clients.find((c) => c.id === event.clientId)
    const lead = state.team.find((m) => m.role === 'coordinator' && m.status === 'active') ?? owner(state)
    const when = `${formatDay(event.date)}${event.startTime ? `, ${formatClock(event.startTime)}` : ''}`
    let next = { ...state, events: updateById(state.events, event.id, { status: 'final_week' }) }
    next = withMessage(next, {
      type: 'email', to: client.email, from: state.business.name, subject: `Final details: ${event.name}`,
      body: `Hi ${firstName(client.name)}, it's the final week! ${when} at ${event.venue}. Your day-of contact is ${lead.name} (${lead.phone}). Your timeline is in your portal.`,
      link: { label: 'Open your portal', to: '/portal', role: 'client', clientId: client.id },
    })
    const vendorsOn = next.eventVendors.filter((x) => x.eventId === event.id && x.status !== 'cancelled')
    for (const ev of vendorsOn) next = toVendor(next, ev, `Final details: ${event.name}`, `Load-in ${ev.arrival ? formatClock(ev.arrival) : 'time TBD'}${ev.area ? ` · ${ev.area}` : ''}. Final headcount and your timeline are on your event page. On-site contact: ${lead.name} (${lead.phone}).`)
    const staffIds = new Set([...next.timeline.filter((t) => t.eventId === event.id && !t.removed).map((t) => t.owner), ...(next.shifts ?? []).filter((s) => s.eventId === event.id && s.status === 'accepted').map((s) => s.memberId)])
    const crew = next.team.filter((m) => staffIds.has(m.id) && m.role !== 'owner' && m.status === 'active')
    for (const m of crew) next = withMessage(next, { type: 'sms', to: `${m.name} · ${m.phone}`, from: state.business.name, subject: 'Final week', body: `${event.name} is ${when} at ${event.venue}. Your call sheet is in the app.`, link: { label: 'Open the app', to: '/app/staff/shifts', role: 'staff', staffId: m.id } })
    const households = getEventGuests(next, event.id).filter((g) => g.rsvp === 'attending').length
    if (households) next = logisticsActionsGuestWeek(next, event.id)
    next = withLog(next, event.id, 'Final week: details sent to the client, vendors, staff and guests')
    return withToast(next, `Final details sent: client, ${vendorsOn.length} vendor${vendorsOn.length === 1 ? '' : 's'}, ${crew.length} staff, ${households} guest household${households === 1 ? '' : 's'}`)
  },
}

// The guests' "one week to go" reminder, the same words as GU-4.1 (directions, parking, dress code)
function logisticsActionsGuestWeek(state, eventId) {
  const event = eventOf(state, eventId)
  let next = state
  for (const g of getEventGuests(state, eventId).filter((x) => x.rsvp === 'attending' && x.invite !== 'stopped')) {
    next = withMessage(next, {
      type: g.phone ? 'sms' : 'email', to: `${g.name} · ${g.phone || g.email}`, from: state.business.name, subject: 'One week to go',
      body: `One week to go! ${event.name} is ${formatDay(event.date)} at ${event.venue}${event.venueInfo?.address ? `, ${event.venueInfo.address}` : ''}.${event.site?.dressCode ? ` Dress code: ${event.site.dressCode}.` : ''} Parking and directions are on the event page.`,
      link: { label: 'Event page', to: `/e/${event.id}?t=${g.token}`, role: 'guest' },
    })
  }
  return next
}
