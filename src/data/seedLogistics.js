// =====================================================================
// Seed data for logistics (product Phase 2): the vendor directory and the
// vendors on each event, the run-of-show, the budget, and the gear (items,
// kits, reservations, pack list).
// Shapes follow the "Later phases" tables in app_outline/erd/data_dictionary.md
// (vendors, event_vendors, timeline_items, budget_lines, equipment_items,
// kits, reservations).
//
// On Thu Nov 5, 2026 the Acme holiday party (Dec 12) is 5 weeks out:
//   • Hill Country Catering is confirmed; DJ Rhythm's insurance (COI)
//     runs out Dec 1, before the party (red flag); Petal & Stem was
//     invited and hasn't set up their profile yet.
//   • 150 chairs are reserved but the business owns 120 (a shortage).
// =====================================================================

export const VENDOR_CATEGORIES = ['Catering', 'DJ / Karaoke', 'Florist', 'Photographer', 'Bakery', 'Rentals', 'Venue', 'Other']

// The planner's vendor directory (schema: vendors). Profiles are reused on every event (VN-1).
export const vendors = [
  { id: 'hcc', name: 'Hill Country Catering', category: 'Catering', contact: 'Maria Gomez', email: 'events@hillcountrycatering.com', phone: '(512) 555-0230',
    rates: '$38–55 per guest', rating: 5, coiExpiresOn: '2027-04-30', w9: true, payout: 'Bank transfer ·6612', profileComplete: true },
  { id: 'rhythm', name: 'DJ Rhythm', category: 'DJ / Karaoke', contact: 'Andre Wallace', email: 'book@djrhythm.com', phone: '(512) 555-0244',
    rates: '$900 for 4 hours', rating: 4, coiExpiresOn: '2026-12-01', w9: true, payout: 'Zelle', profileComplete: true },
  { id: 'petal', name: 'Petal & Stem', category: 'Florist', contact: 'June Park', email: 'hello@petalandstem.com', phone: '(512) 555-0251',
    rates: 'Centerpieces from $45', rating: null, coiExpiresOn: null, w9: false, payout: '', profileComplete: false },
  { id: 'lavaca', name: 'Lavaca Street Kitchen', category: 'Catering', contact: 'Tom Reyes', email: 'catering@lavacakitchen.com', phone: '(512) 555-0262',
    rates: '$22–30 per guest', rating: 5, coiExpiresOn: '2027-02-28', w9: true, payout: 'Bank transfer ·0931', profileComplete: true },
  { id: 'austin-sound', name: 'Austin Sound Co.', category: 'DJ / Karaoke', contact: 'Lee Chen', email: 'gigs@austinsound.co', phone: '(512) 555-0273',
    rates: '$750 for 4 hours', rating: 4, coiExpiresOn: '2027-06-30', w9: true, payout: 'Check', profileComplete: true },
  { id: 'golden-hour', name: 'Golden Hour Photo', category: 'Photographer', contact: 'Sofia Alvarez', email: 'sofia@goldenhour.photo', phone: '(512) 555-0284',
    rates: '$1,800 for 6 hours', rating: 5, coiExpiresOn: '2027-03-15', w9: true, payout: 'Bank transfer ·2210', profileComplete: true },
  { id: 'bluebonnet', name: 'Bluebonnet Bakery', category: 'Bakery', contact: 'Rita Moss', email: 'orders@bluebonnetbakery.com', phone: '(512) 555-0295',
    rates: 'Cakes from $4.50 a slice', rating: 4, coiExpiresOn: '2027-01-31', w9: true, payout: 'Check', profileComplete: true },
  { id: 'apr', name: 'Austin Party Rentals', category: 'Rentals', contact: 'Desk', email: 'orders@austinpartyrentals.com', phone: '(512) 555-0300',
    rates: 'Chairs $2.50 each', rating: 4, coiExpiresOn: '2027-05-31', w9: true, payout: 'Card on file', profileComplete: true },
]

const doc = (id, name, kind, at) => ({ id, name, kind, at })

// Vendors booked on an event (schema: event_vendors). token = the vendor's magic link (/v/<token>).
// status: invited | confirmed | cancelled. arrival = load-in time on the day.
export const eventVendors = [
  { id: 'acme-hcc', eventId: 'acme', vendorId: 'hcc', token: 'v-acme-hcc', status: 'confirmed', invitedAt: '2026-10-12T10:00:00', confirmedAt: '2026-10-14T09:30:00',
    arrival: '17:00', area: 'Kitchen and the buffet line', amountCents: 540000, dueDate: '2026-12-05', cutoffDays: 7,
    notes: 'Plated dinner for the final headcount. Vegetarian main: mushroom risotto (approved by Priya Nov 4).',
    docs: [doc('d-hcc1', 'Hill Country contract.pdf', 'contract', '2026-10-14T09:30:00'), doc('d-hcc2', 'Hill Country COI 2027.pdf', 'coi', '2026-10-14T09:31:00')],
    payments: [{ id: 'vp1', at: '2026-10-15T12:00:00', amountCents: 162000, method: 'Bank transfer' }], changes: [], arrivedAt: null, rating: null },
  { id: 'acme-rhythm', eventId: 'acme', vendorId: 'rhythm', token: 'v-acme-rhythm', status: 'confirmed', invitedAt: '2026-10-12T10:05:00', confirmedAt: '2026-10-13T18:00:00',
    arrival: '17:30', area: 'Stage, stage-left power', amountCents: 90000, dueDate: '2026-12-12', cutoffDays: 3,
    notes: 'Karaoke 9:30–11:30 PM. Clean versions only (corporate event).',
    docs: [doc('d-rh1', 'DJ Rhythm agreement.pdf', 'contract', '2026-10-13T18:00:00')],
    payments: [], arrivedAt: null, rating: null,
    changes: [{ id: 'ch-rh1', at: '2026-11-03T11:00:00', text: 'Karaoke moved to 9:30–11:30 PM (was 9–11 PM).', acknowledgedAt: null, pastCutoff: false }] },
  { id: 'acme-petal', eventId: 'acme', vendorId: 'petal', token: 'v-acme-petal', status: 'invited', invitedAt: '2026-11-02T10:00:00', confirmedAt: null,
    arrival: '16:00', area: 'Ballroom tables and the foyer', amountCents: 65000, dueDate: '2026-12-01', cutoffDays: 5,
    notes: '15 low centerpieces (white and gold), 2 foyer arrangements.', docs: [], payments: [], changes: [], arrivedAt: null, rating: null },
  { id: 'thompson-lavaca', eventId: 'thompson', vendorId: 'lavaca', token: 'v-thompson-lavaca', status: 'confirmed', invitedAt: '2026-10-27T12:00:00', confirmedAt: '2026-10-27T15:00:00',
    arrival: '10:00', area: 'Fellowship hall kitchen', amountCents: 180000, dueDate: '2026-11-13', cutoffDays: 3,
    notes: 'Light lunch for about 90: sandwiches, salads, sweet tea. Mrs. Thompson asked for her lemon cake recipe.',
    docs: [doc('d-lv1', 'Lavaca order.pdf', 'contract', '2026-10-27T15:00:00'), doc('d-lv2', 'Lavaca COI.pdf', 'coi', '2026-10-27T15:01:00')],
    payments: [], changes: [], arrivedAt: null, rating: null },
  // A past event: rated privately after the party (VN-8)
  { id: 'okafor-rhythm', eventId: 'okafor', vendorId: 'rhythm', token: 'v-okafor-rhythm', status: 'confirmed', invitedAt: '2026-09-02T10:00:00', confirmedAt: '2026-09-03T10:00:00',
    arrival: '18:00', area: 'Back patio', amountCents: 80000, dueDate: '2026-10-17', cutoffDays: 3, notes: '',
    docs: [doc('d-ok1', 'DJ Rhythm agreement.pdf', 'contract', '2026-09-03T10:00:00')],
    payments: [{ id: 'vp2', at: '2026-10-18T10:00:00', amountCents: 80000, method: 'Zelle' }], changes: [], arrivedAt: '2026-10-17T17:52:00',
    rating: { stars: 5, note: 'Packed dance floor; great with the older guests.', at: '2026-10-19T09:00:00' } },
]

// Run-of-show (schema: timeline_items). owner: a team member id, 'client', or 'v:<eventVendorId>'.
// visibility: who besides the planner sees the item (vendors only see their own items).
const item = (id, eventId, time, minutes, title, owner, location, visibility, notes = '') =>
  ({ id, eventId, time, minutes, title, owner, location, visibility, notes, done: false })
const ALL = ['client', 'vendor', 'staff']
export const timeline = [
  item('ro1', 'acme', '15:00', 90, 'Load in: photo booth and karaoke gear', 'sam', 'Ballroom', ['staff'], 'Brazos St service door. Elevator to the ballroom level.'),
  item('ro2', 'acme', '16:00', 60, 'Flowers on the tables', 'v:acme-petal', 'Ballroom + foyer', ['vendor', 'staff']),
  item('ro3', 'acme', '17:00', 90, 'Catering sets the buffet', 'v:acme-hcc', 'Kitchen', ['vendor', 'staff']),
  item('ro4', 'acme', '17:30', 30, 'Sound check', 'v:acme-rhythm', 'Stage', ['vendor', 'staff']),
  item('ro5', 'acme', '18:30', 15, 'Team briefing', 'devon', 'Foyer', ['staff'], 'Walk the room; radios on channel 2.'),
  item('ro6', 'acme', '19:00', 60, 'Doors open · cocktails', 'devon', 'Foyer', ALL),
  item('ro7', 'acme', '20:00', 30, 'Dinner service', 'v:acme-hcc', 'Ballroom', ALL, 'Plated. Vegetarian main: mushroom risotto.'),
  item('ro8', 'acme', '20:30', 15, 'Awards (Priya speaks)', 'client', 'Stage', ALL, 'Dim the lights, mic 1 to Priya.'),
  item('ro9', 'acme', '21:30', 120, 'Karaoke and photo booth open', 'v:acme-rhythm', 'Ballroom', ALL),
  item('ro10', 'acme', '23:30', 15, 'Last song and thank-you', 'devon', 'Stage', ALL),
  item('ro11', 'acme', '23:45', 15, 'Teardown begins', 'sam', 'Ballroom', ['staff']),
  item('ro20', 'thompson', '09:30', 60, 'Set chairs and the memory table; test the slideshow', 'devon', 'Fellowship hall', ['staff']),
  item('ro21', 'thompson', '10:00', 60, 'Lunch delivered and set', 'v:thompson-lavaca', 'Kitchen', ['vendor', 'staff']),
  item('ro22', 'thompson', '11:00', 75, 'Service', 'client', 'Sanctuary', ALL, 'Programs at both doors.'),
  item('ro23', 'thompson', '12:30', 90, 'Reception and sharing of memories', 'devon', 'Fellowship hall', ALL),
  item('ro24', 'thompson', '14:00', 30, 'Family departs; teardown', 'devon', 'Fellowship hall', ['staff']),
]

// Run-of-show starters (PL-4.11 "Build from a template"): [minutes from the start time, title, length]
export const TIMELINE_TEMPLATES = {
  wedding: [[-180, 'Vendors load in', 120], [-60, 'Wedding party photos', 45], [0, 'Ceremony', 30], [30, 'Cocktail hour', 60], [90, 'Grand entrance', 10],
    [100, 'Dinner', 60], [160, 'Toasts', 20], [180, 'First dance', 10], [190, 'Dancing', 150], [340, 'Last dance and send-off', 20]],
  corporate: [[-180, 'Load in and set up', 120], [-30, 'Team briefing', 15], [0, 'Doors open · cocktails', 60], [60, 'Dinner', 60], [90, 'Speeches and awards', 20], [150, 'Entertainment', 120], [270, 'Last call', 15]],
  memorial: [[-90, 'Set up the hall and the memory table', 60], [0, 'Service', 75], [90, 'Reception', 90], [180, 'Family departs', 15]],
  default: [[-120, 'Load in and set up', 90], [0, 'Guests arrive', 30], [30, 'Food is served', 60], [90, 'Main activity', 120], [210, 'Wrap up', 15]],
}

// Budget lines (schema: budget_lines). eventVendorId ties a vendor's invoice to a category.
export const budgetLines = [
  { id: 'b1', eventId: 'acme', category: 'Catering', estimatedCents: 525000, actualCents: 540000, eventVendorId: 'acme-hcc' },
  { id: 'b2', eventId: 'acme', category: 'DJ / Karaoke', estimatedCents: 90000, actualCents: 90000, eventVendorId: 'acme-rhythm' },
  { id: 'b3', eventId: 'acme', category: 'Flowers', estimatedCents: 60000, actualCents: 0, eventVendorId: 'acme-petal' },
  { id: 'b4', eventId: 'acme', category: 'Rentals', estimatedCents: 7500, actualCents: 0, eventVendorId: null },
  { id: 'b5', eventId: 'thompson', category: 'Catering', estimatedCents: 180000, actualCents: 180000, eventVendorId: 'thompson-lavaca' },
  { id: 'b6', eventId: 'thompson', category: 'Printing', estimatedCents: 15000, actualCents: 12800, eventVendorId: null },
]

// ---- Gear (schema: equipment_items, kits, reservations) ----
// wearCents: what one event costs that item in wear and tear (the profit view counts it).
export const equipment = [
  { id: 'booth-camera', name: 'Booth camera + tablet', category: 'Photo booth', owned: 2, wearCents: 1500, label: 'CR-BC-01' },
  { id: 'booth-printer', name: 'Dye-sub printer', category: 'Photo booth', owned: 2, wearCents: 1000, label: 'CR-BP-01' },
  { id: 'backdrop', name: 'Sequin backdrop', category: 'Photo booth', owned: 3, wearCents: 500, label: 'CR-BD-01' },
  { id: 'ring-light', name: 'Ring light', category: 'Photo booth', owned: 2, wearCents: 300, label: 'CR-RL-01' },
  { id: 'props', name: 'Props bin', category: 'Photo booth', owned: 2, wearCents: 800, label: 'CR-PB-01' },
  { id: 'speakers', name: 'PA speaker', category: 'Karaoke', owned: 4, wearCents: 700, label: 'CR-SP-01' },
  { id: 'mics', name: 'Wireless mic', category: 'Karaoke', owned: 8, wearCents: 200, label: 'CR-MC-01' },
  { id: 'mixer', name: 'Mixer', category: 'Karaoke', owned: 2, wearCents: 500, label: 'CR-MX-01' },
  { id: 'lyrics-screen', name: 'Lyrics screen (55")', category: 'Karaoke', owned: 1, wearCents: 1000, label: 'CR-LS-01' },
  { id: 'chairs', name: 'White folding chair', category: 'Rentals', owned: 120, wearCents: 10, label: 'CR-CH-##' },
  { id: 'uplights', name: 'Uplight', category: 'Lighting', owned: 16, wearCents: 100, label: 'CR-UL-##' },
]
export const kits = [
  { id: 'kit-booth', name: 'Photo booth kit', addonId: 'photo-booth', items: [['booth-camera', 1], ['booth-printer', 1], ['backdrop', 1], ['ring-light', 1], ['props', 1]] },
  { id: 'kit-karaoke', name: 'Karaoke kit', addonId: 'karaoke', items: [['speakers', 2], ['mics', 4], ['mixer', 1], ['lyrics-screen', 1]] },
]
// partnerQty: pieces rented from a partner to cover a shortage (PL-6.2)
const res = (id, eventId, itemId, qty, kitId = null, partner = null) => ({ id, eventId, itemId, qty, kitId, partner })
export const reservations = [
  ...kits[0].items.map(([itemId, qty], i) => res(`r-acme-b${i}`, 'acme', itemId, qty, 'kit-booth')),
  ...kits[1].items.map(([itemId, qty], i) => res(`r-acme-k${i}`, 'acme', itemId, qty, 'kit-karaoke')),
  res('r-acme-ch', 'acme', 'chairs', 150),
  res('r-acme-ul', 'acme', 'uplights', 12),
  res('r-th-ch', 'thompson', 'chairs', 90),
  res('r-hope-ch', 'hope', 'chairs', 200, null, { name: 'Austin Party Rentals', qty: 80 }),
  ...kits[1].items.map(([itemId, qty], i) => res(`r-patel-k${i}`, 'patel', itemId, qty, 'kit-karaoke')),
  ...kits[0].items.map(([itemId, qty], i) => res(`r-garza-b${i}`, 'garza', itemId, qty, 'kit-booth')),
]
// Packed into the van every time (PL-6.3)
export const ALWAYS_BRING = ['Extension cords (4)', 'Gaffer tape', 'First-aid kit', 'Tool kit', 'Table skirts', 'Zip ties']
