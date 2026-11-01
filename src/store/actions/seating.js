// =====================================================================
// Tickets and seating (product Phase 4): buy tickets with tiers, promo
// codes, capacity and a waitlist (GU-3.4); check tickets in at the door;
// lay out the floor plan and seat households (PL-4.12). While someone is
// dragging, the plan is locked for everyone else (NFR-11).
// =====================================================================
import { formatDay, nowStamp } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { FLOOR_OBJECTS } from '../../data/seedSeating'
import { getTables, promoFor, ticketSales } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const setPlan = (state, eventId, change) => ({ ...state, events: updateById(state.events, eventId, (e) => ({ floorPlan: { ...e.floorPlan, ...(typeof change === 'function' ? change(e.floorPlan) : change) } })) })
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const code = () => newId('t').split('-').slice(1).join('').toUpperCase().slice(-6)

export const seatingActions = {
  // ---- Tickets (GU-3.4) ----
  'ticketing/configure': (state, a) => ({ ...state, events: updateById(state.events, a.eventId, (e) => ({ ticketing: { ...e.ticketing, ...a.changes } })) }),

  'ticket/buy': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event?.ticketing?.enabled || state.tickets.some((t) => t.orderKey === a.key)) return state     // a double tap buys once
    if (!a.buyer?.trim() || !a.email?.trim()) return state
    const sales = ticketSales(state, event.id)
    const lines = (a.lines ?? []).filter((l) => l.qty > 0)
    if (!lines.length) return state
    for (const l of lines) {
      const tier = sales.tiers.find((t) => t.id === l.tierId)
      if (!tier || l.qty > tier.left) return withToast(state, `Only ${tier?.left ?? 0} ${tier?.name ?? ''} ticket${tier?.left === 1 ? '' : 's'} left.`, 'warning')
    }
    const promo = promoFor(event, a.promo)
    const orderId = newId('o')
    const made = lines.flatMap((l) => {
      const tier = event.ticketing.tiers.find((t) => t.id === l.tierId)
      const price = promo ? Math.round(tier.priceCents * (100 - promo.percentOff) / 100) : tier.priceCents
      return Array.from({ length: l.qty }, (_, i) => ({
        id: newId('tk'), eventId: event.id, orderId, orderKey: a.key, tierId: tier.id, holder: i === 0 && lines[0] === l ? a.buyer.trim() : `${a.buyer.trim()} guest ${i + 1}`,
        email: a.email.trim(), code: `${event.id.slice(0, 4).toUpperCase()}-${code()}`, paidCents: price, promo: promo?.code ?? null, at: nowStamp(), checkedInAt: null,
      }))
    })
    const total = made.reduce((t, k) => t + k.paidCents, 0)
    const deductible = event.fund?.kind === 'charity' ? made.reduce((t, k) => t + Math.max(0, k.paidCents - (event.ticketing.tiers.find((x) => x.id === k.tierId).fmvCents ?? 0)), 0) : 0
    let next = { ...state, tickets: [...state.tickets, ...made] }
    next = withMessage(next, {
      type: 'email', to: a.email.trim(), from: state.business.name, subject: `Your tickets: ${event.name}`,
      body: `${made.length} ticket${made.length > 1 ? 's' : ''} for ${formatDay(event.date)} at ${event.venue}. Paid ${formatMoney(total)}.${deductible ? ` ${formatMoney(deductible)} is tax-deductible (${event.fund.org.name}, tax ID ${event.fund.org.taxId}).` : ''} Show the QR codes at the door, or add them to your phone's wallet.`,
      link: { label: 'Show my tickets', to: `/e/${event.id}/tickets?o=${orderId}`, role: 'guest' },
    })
    return withToast(next, `${made.length} ticket${made.length > 1 ? 's' : ''} for ${firstName(a.buyer)}: ${formatMoney(total)}`)
  },
  'waitlist/join': (state, a) => {
    if (!a.name?.trim() || !a.email?.trim()) return state
    return withToast({ ...state, waitlist: [...state.waitlist, { id: newId('w'), eventId: a.eventId, tierId: a.tierId, name: a.name.trim(), email: a.email.trim(), at: nowStamp() }] }, 'You’re on the waitlist. We’ll email you if a spot opens.')
  },
  'ticket/checkIn': (state, a) => {
    const t = state.tickets.find((x) => x.id === a.id)
    if (!t) return state
    if (t.checkedInAt) return withToast(state, `${t.holder}'s ticket was already used`, 'warning')
    return withToast({ ...state, tickets: updateById(state.tickets, t.id, { checkedInAt: nowStamp() }) }, `Ticket checked in: ${t.holder}`)
  },

  // ---- Floor plan (PL-4.12) ----
  'floor/setRoom': (state, a) => setPlan(state, a.eventId, a.changes),
  'floor/add': (state, a) => setPlan(state, a.eventId, (plan) => {
    const [kind, label, w, h, seats] = FLOOR_OBJECTS.find(([k]) => k === a.kind)
    const tables = plan.objects.filter((o) => o.kind.startsWith('table'))
    const isTable = kind.startsWith('table')
    const id = newId('obj')
    return { objects: [...plan.objects, { id, kind, label: isTable ? String(tables.length + 1) : label, x: clamp(plan.widthFt / 2 - w / 2, 0, plan.widthFt - w), y: clamp(plan.heightFt / 2 - h / 2, 0, plan.heightFt - h), w, h, seats }] }
  }),
  'floor/move': (state, a) => setPlan(state, a.eventId, (plan) => ({
    objects: plan.objects.map((o) => (o.id === a.id ? { ...o, x: clamp(Math.round(a.x * 2) / 2, 0, plan.widthFt - o.w), y: clamp(Math.round(a.y * 2) / 2, 0, plan.heightFt - o.h) } : o)),
  })),
  'floor/update': (state, a) => setPlan(state, a.eventId, (plan) => ({ objects: plan.objects.map((o) => (o.id === a.id ? { ...o, ...a.changes } : o)) })),
  // Removing a table unseats its guests (they go back to "not seated")
  'floor/remove': (state, a) => {
    const next = setPlan(state, a.eventId, (plan) => ({ objects: plan.objects.filter((o) => o.id !== a.id) }))
    return { ...next, guests: next.guests.map((g) => (g.eventId === a.eventId && g.tableId === a.id ? { ...g, tableId: null } : g)) }
  },
  // NFR-11: one person drags at a time
  'floor/lock': (state, a) => setPlan(state, a.eventId, { lockedBy: a.by ?? null }),

  // ---- Seating ----
  'seat/assign': (state, a) => {
    const g = state.guests.find((x) => x.id === a.guestId)
    if (!g) return state
    if (a.tableId) {
      const table = getTables(state, g.eventId).find((t) => t.id === a.tableId)
      const size = g.rsvp === 'attending' ? g.attending : 1 + (g.plusOnes ?? 0)
      const left = table.left + (g.tableId === table.id ? size : 0)
      if (size > left) return withToast(state, `Table ${table.label} has ${left} seat${left === 1 ? '' : 's'} left; ${g.name}'s party is ${size}.`, 'warning')
    }
    return { ...state, guests: updateById(state.guests, g.id, { tableId: a.tableId ?? null }) }
  },
  'guest/avoid': (state, a) => ({
    ...state,
    guests: state.guests.map((g) => {
      if (g.id !== a.guestId && g.id !== a.otherId) return g
      const other = g.id === a.guestId ? a.otherId : a.guestId
      const list = new Set(g.avoid ?? [])
      if (a.on) list.add(other); else list.delete(other)
      return { ...g, avoid: [...list] }
    }),
  }),
}
