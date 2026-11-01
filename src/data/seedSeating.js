// =====================================================================
// Tickets and seating (product Phase 4).
// Shapes follow the "Later phases" tables in data_dictionary.md
// (ticket_tiers, tickets, floor_plans, seat_assignments).
//   • floor plans are measured in feet; objects have x, y, w, h in feet
//   • a guest's seat is guest.tableId (one household per table)
//   • guest.avoid: ids of households not to seat near (same table = flagged)
//   • a ticket's fmvCents = the value received (dinner), so a "Patron"
//     ticket is partly tax-deductible (DN-2)
// Acme's ballroom is laid out; the Hope potluck sells dinner tickets.
// =====================================================================

export const FLOOR_OBJECTS = [
  ['table-round', 'Round table', 6, 6, 10], ['table-rect', 'Long table', 8, 3, 8], ['dance', 'Dance floor', 16, 16, 0],
  ['stage', 'Stage', 20, 8, 0], ['buffet', 'Buffet', 16, 3, 0], ['bar', 'Bar', 10, 3, 0], ['booth', 'Photo booth', 8, 8, 0],
  ['kj', 'KJ station', 6, 4, 0], ['outlet', 'Outlet', 1.5, 1.5, 0], ['exit', 'Exit', 5, 1.5, 0],
]

/** No layout yet (PL-4.12): a room size and nothing in it. */
export const defaultFloorPlan = () => ({ background: null, widthFt: 80, heightFt: 50, objects: [], lockedBy: null })
export const defaultTicketing = () => ({ enabled: false, tiers: [], promos: [], waitlist: true })

const table = (n, x, y) => ({ id: `t${n}`, kind: 'table-round', label: String(n), x, y, w: 6, h: 6, seats: 10 })
export const seatingDetails = {
  acme: {
    floorPlan: {
      background: null, widthFt: 96, heightFt: 64, lockedBy: null,
      objects: [
        { id: 'stage', kind: 'stage', label: 'Stage', x: 38, y: 2, w: 20, h: 8, seats: 0 },
        { id: 'dance', kind: 'dance', label: 'Dance floor', x: 40, y: 14, w: 16, h: 16, seats: 0 },
        { id: 'kj', kind: 'kj', label: 'KJ', x: 59, y: 4, w: 6, h: 4, seats: 0 },
        { id: 'booth', kind: 'booth', label: 'Photo booth', x: 84, y: 4, w: 8, h: 8, seats: 0 },
        { id: 'buffet', kind: 'buffet', label: 'Buffet', x: 4, y: 58, w: 20, h: 3, seats: 0 },
        { id: 'bar', kind: 'bar', label: 'Bar', x: 72, y: 58, w: 12, h: 3, seats: 0 },
        { id: 'exit1', kind: 'exit', label: 'Exit', x: 0, y: 30, w: 1.5, h: 5, seats: 0 },
        { id: 'exit2', kind: 'exit', label: 'Exit', x: 94.5, y: 30, w: 1.5, h: 5, seats: 0 },
        { id: 'out1', kind: 'outlet', label: 'Outlet', x: 62, y: 1, w: 1.5, h: 1.5, seats: 0 },
        { id: 'out2', kind: 'outlet', label: 'Outlet', x: 90, y: 1, w: 1.5, h: 1.5, seats: 0 },
        table(1, 6, 6), table(2, 18, 6), table(3, 28, 14), table(4, 6, 18), table(5, 18, 20),
        table(6, 6, 32), table(7, 18, 34), table(8, 30, 34), table(9, 42, 36), table(10, 54, 36),
        table(11, 66, 34), table(12, 78, 32), table(13, 66, 18), table(14, 78, 18), table(15, 66, 6),
      ],
    },
  },
}
// Who sits where at Acme (households), and who shouldn't sit together
export const seats = { 'acme-g1': 't9', 'acme-g2': 't3', 'acme-g3': 't3', 'acme-g4': 't10', 'acme-g5': 't3', 'acme-g9': 't10', 'acme-g12': 't10', 'acme-g14': 't11' }
export const avoid = { 'acme-g2': ['acme-g5'], 'acme-g5': ['acme-g2'] }   // Marcus and Alicia: keep apart

export const ticketingDetails = {
  hope: {
    enabled: true, waitlist: true,
    tiers: [
      { id: 'dinner', name: 'Dinner', priceCents: 1500, fmvCents: 1500, capacity: 150, note: 'Supper and dessert' },
      { id: 'patron', name: 'Patron', priceCents: 10000, fmvCents: 1500, capacity: 30, note: 'Supper, reserved seating, and $85 toward the roof (tax-deductible)' },
      { id: 'kids', name: 'Kids (12 and under)', priceCents: 0, fmvCents: 0, capacity: 40, note: 'Free' },
    ],
    promos: [{ code: 'CHOIR', percentOff: 20 }],
  },
}
const ticket = (id, tierId, holder, email, extra = {}) => ({ id, eventId: 'hope', orderId: extra.orderId ?? `o-${id}`, tierId, holder, email, code: `HOPE-${id.toUpperCase()}`, paidCents: 0, at: '2026-11-01T10:00:00', checkedInAt: null, ...extra })
export const tickets = [
  ticket('k1', 'patron', 'Pastor James Cole', 'office@hopechurchatx.org', { paidCents: 10000 }),
  ticket('k2', 'patron', 'Deacon Ray Hill', 'rhill@gmail.com', { paidCents: 10000, orderId: 'o-hill' }),
  ticket('k3', 'patron', 'Tasha Hill', 'rhill@gmail.com', { paidCents: 10000, orderId: 'o-hill' }),
  ticket('k4', 'dinner', 'Gloria Mendez', 'gloria.m@gmail.com', { paidCents: 1500 }),
  ticket('k5', 'dinner', 'Ruth Bell', 'ruthbell@att.net', { paidCents: 1200, promo: 'CHOIR' }),
  ticket('k6', 'kids', 'Mateo Mendez', 'gloria.m@gmail.com', { orderId: 'o-k4' }),
]
export const waitlist = []
