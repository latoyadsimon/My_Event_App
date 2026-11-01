// =====================================================================
// Growing the business (product Phase 4): marketing reminders to past
// clients who opted in, feedback (client reviews and guest surveys), and
// the planner's event templates.
//   • a key date repeats yearly when `yearly`; reminders go out about two
//     months before (PL-9.2: "Your baby's first birthday is in 2 months")
//   • memorial clients are never marketed to, opted in or not
// =====================================================================

export const REVIEW_SITES = [
  ['google', 'Google', 'https://www.google.com/maps'], ['yelp', 'Yelp', 'https://www.yelp.com'],
  ['theknot', 'The Knot', 'https://www.theknot.com'], ['weddingwire', 'WeddingWire', 'https://www.weddingwire.com'],
]

// clientId → { optIn, dates, sent }
export const marketing = {
  okafor: { optIn: true, dates: [{ id: 'kd1', label: 'Chidi’s birthday', date: '2027-10-17', yearly: true }], sent: [] },
  morales: { optIn: true, dates: [{ id: 'kd2', label: 'Baby Luis’s first birthday', date: '2026-12-20', yearly: false }, { id: 'kd3', label: 'Sofia’s birthday', date: '2027-09-12', yearly: true }], sent: [] },
  westlake: { optIn: true, dates: [{ id: 'kd4', label: 'The spring gala', date: '2027-04-10', yearly: true }], sent: [] },
  garza: { optIn: true, dates: [{ id: 'kd5', label: 'Wedding anniversary', date: '2028-09-18', yearly: true }], sent: [] },
  acme: { optIn: false, dates: [{ id: 'kd6', label: 'Next holiday party', date: '2027-12-11', yearly: true }], sent: [] },
  thompson: { optIn: true, dates: [], sent: [] },
}

const fb = (id, eventId, from, name, score, comment = '', at = '2026-10-22T10:00:00') => ({ id, eventId, from, name, score, comment, at, key: id })
export const feedback = [
  fb('fb1', 'westlake', 'client', 'Karen Holt', 5, 'Everything ran on time and the photo booth line never stopped. The PTA is already asking about next year.', '2026-10-08T09:00:00'),
  fb('fb2', 'westlake', 'guest', 'A guest', 5), fb('fb3', 'westlake', 'guest', 'A guest', 4, 'Loved the booth!'), fb('fb4', 'westlake', 'guest', 'A guest', 5),
  fb('fb5', 'okafor', 'client', 'Chidi Okafor', 5, 'DJ Rhythm and your team made my 50th unforgettable.', '2026-10-21T18:00:00'),
  fb('fb6', 'okafor', 'guest', 'A guest', 4), fb('fb7', 'morales', 'client', 'Rosa Morales', 4, 'Beautiful night. The check-in line was a little slow.', '2026-09-20T12:00:00'),
]
