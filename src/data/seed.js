// =====================================================================
// Seed data: the world as it stands on Thu Nov 5, 2026, 6 PM (see lib/clock.js).
// The app copies this into memory on load. Refreshing the page starts over,
// on purpose, until we connect Supabase.
//
// Shapes follow app_outline/erd/schema.sql (simplified), so swapping this file
// for real queries later changes the data source, not the screens.
//   • money is in cents      • calendar days are 'YYYY-MM-DD'
//   • ids are readable slugs so URLs read well (/app/leads/rivera)
//
// The story so far (wireframes/walkthrough_rivera.md):
//   Oct 28  Ana inquires → auto-reply → books a consult
//   Nov 2   consult; proposal v1 sent
//   Nov 3   Ana asks for photo magnets to be optional
//   Nov 4   v2 sent  ← we are here: waiting for Ana to accept, sign and pay
// =====================================================================
import { splitByPercent } from '../lib/money'

export const business = {
  id: 'bella-events',
  name: 'Bella Events',
  slug: 'bella-events',
  initials: 'BE',
  email: 'hello@bellaevents.com',
  phone: '(512) 555-0142',
  city: 'Austin, TX',
  timezone: 'America/Chicago',
  brandColor: '#A3336A',
  taxRatePercent: 8,
  depositPercent: 30,
  paymentsConnected: true,
  // Onboarding wizard progress (Dashboard shows what's left)
  onboarding: { business: true, branding: true, packages: true, payments: true, calendar: false },
}

// The person using the planner side in this demo, plus the team.
export const team = [
  { id: 'latoya', name: 'LaToya Simon', role: 'owner', email: 'latoya@bellaevents.com', phone: '(512) 555-0142', permissions: { see_budgets: true } },
  { id: 'devon', name: 'Devon Brooks', role: 'coordinator', email: 'devon@bellaevents.com', phone: '(512) 555-0177', permissions: { see_budgets: true } },
  { id: 'sam', name: 'Sam Ortiz', role: 'staff', email: 'sam.ortiz@gmail.com', phone: '(512) 555-0109', permissions: { see_budgets: false } },
]

export const packages = [
  { id: 'silver', name: 'Silver', priceCents: 800000, includes: ['Day-of coordination', 'Timeline', '1 planning meeting'] },
  { id: 'gold', name: 'Gold', priceCents: 1100000, includes: ['Partial planning', 'Vendor booking', '3 planning meetings', 'Photo magnets'] },
  { id: 'platinum', name: 'Platinum', priceCents: 1550000, includes: ['Full planning', 'Design + décor', 'Unlimited meetings', 'Photo magnets'] },
]

// Add-ons the planner can put on a proposal. `owned` = how many the business has (gear check).
export const addons = [
  { id: 'photo-booth', name: 'Photo booth (4 hrs)', priceCents: 150000, unit: 'each' },
  { id: 'karaoke', name: 'Karaoke + KJ (3 hrs)', priceCents: 90000, unit: 'each' },
  { id: 'chairs', name: 'Chairs', priceCents: 250, unit: 'chair', owned: 120 },
  { id: 'photo-magnets', name: 'Photo magnets', priceCents: 60000, unit: 'each' },
  { id: 'extra-karaoke-hour', name: 'Extra karaoke hour', priceCents: 25000, unit: 'hour' },
]

export const clients = [
  { id: 'ana', name: 'Ana Rivera', partner: 'Marco Rivera', email: 'ana.rivera@gmail.com', phone: '(512) 555-0188' },
  { id: 'acme', name: 'Priya Shah', company: 'Acme Robotics', email: 'pshah@acmerobotics.com', phone: '(512) 555-0120' },
  { id: 'hope', name: 'Pastor James Cole', company: 'Hope Community Church', email: 'office@hopechurchatx.org', phone: '(512) 555-0161' },
  { id: 'patel', name: 'Raj Patel', email: 'raj.patel@outlook.com', phone: '(512) 555-0133' },
  { id: 'thompson', name: 'Denise Thompson', email: 'denise.t@gmail.com', phone: '(512) 555-0195' },
  { id: 'lee', name: 'Grace Lee', email: 'grace.lee@gmail.com', phone: '(512) 555-0150' },
  { id: 'kim', name: 'Daniel Kim', email: 'dkim@gmail.com', phone: '(512) 555-0114' },
  { id: 'nguyen', name: 'Linh Nguyen', email: 'linh.nguyen@yahoo.com', phone: '(512) 555-0172' },
]

// Lead stages, in kanban order
export const LEAD_STAGES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'consult_booked', label: 'Consult booked' },
  { id: 'proposal_sent', label: 'Proposal sent' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
]

export const leads = [
  {
    id: 'rivera', clientId: 'ana', title: 'Rivera wedding', eventType: 'wedding', eventDate: '2027-06-12',
    guestCount: 120, budget: '$15–20k', services: ['Photo booth', 'Karaoke'], venue: 'Hacienda Venue',
    source: 'Instagram', stage: 'proposal_sent', receivedAt: '2026-10-28T09:41:00', consultAt: '2026-11-02T14:00:00',
    activity: [
      { at: '2026-10-28T09:41:00', text: 'Inquiry received from website' },
      { at: '2026-10-28T09:41:00', text: 'Auto-reply sent with booking link' },
      { at: '2026-10-28T10:05:00', text: 'Consult booked: Mon Nov 2, 2:00 PM' },
      { at: '2026-11-02T15:30:00', text: 'Proposal v1 sent' },
      { at: '2026-11-03T20:14:00', text: 'Ana requested changes to the proposal' },
      { at: '2026-11-04T11:02:00', text: 'Proposal v2 sent' },
    ],
  },
  {
    id: 'nguyen', clientId: 'nguyen', title: 'Nguyen baby shower', eventType: 'baby_shower', eventDate: '2027-01-23',
    guestCount: 35, budget: '$2–3k', services: ['Décor', 'Photo booth'], venue: 'Home (Round Rock)',
    source: 'Google', stage: 'new', receivedAt: '2026-11-05T16:40:00',
    activity: [{ at: '2026-11-05T16:40:00', text: 'Inquiry received from website' }, { at: '2026-11-05T16:40:00', text: 'Auto-reply sent with booking link' }],
  },
  {
    id: 'kim', clientId: 'kim', title: 'Kim 40th birthday', eventType: 'birthday', eventDate: '2026-12-12',
    guestCount: 40, budget: '$2–4k', services: ['Karaoke'], venue: 'TBD',
    source: 'Referral', stage: 'new', receivedAt: '2026-11-03T12:15:00',
    activity: [{ at: '2026-11-03T12:15:00', text: 'Inquiry received from website' }],
  },
  {
    id: 'lee', clientId: 'lee', title: 'Lee bridal shower', eventType: 'bridal_shower', eventDate: '2026-12-05',
    guestCount: 30, budget: '$3k', services: ['Décor'], venue: 'The Garden Room',
    source: 'Google', stage: 'contacted', receivedAt: '2026-10-21T08:30:00',
    activity: [{ at: '2026-10-21T08:30:00', text: 'Inquiry received from website' }, { at: '2026-10-22T09:00:00', text: 'You replied by email' }],
  },
  // Won leads became the events below
  { id: 'acme', clientId: 'acme', title: 'Acme holiday party', eventType: 'corporate', eventDate: '2026-12-12', guestCount: 150, budget: '$12k', services: ['Karaoke', 'Photo booth'], venue: 'The Driskill Ballroom', source: 'The Knot', stage: 'won', receivedAt: '2026-09-02T10:00:00', activity: [] },
  { id: 'hope', clientId: 'hope', title: 'Hope Church potluck', eventType: 'potluck', eventDate: '2027-01-09', guestCount: 200, budget: '$1–2k', services: ['Chairs'], venue: 'Hope Community Church hall', source: 'Facebook', stage: 'won', receivedAt: '2026-09-20T10:00:00', activity: [] },
  { id: 'patel', clientId: 'patel', title: 'Patel family reunion', eventType: 'reunion', eventDate: '2027-03-03', guestCount: 80, budget: '$6k', services: ['Karaoke'], venue: 'Zilker Clubhouse', source: 'Referral', stage: 'won', receivedAt: '2026-08-14T10:00:00', activity: [] },
  { id: 'thompson', clientId: 'thompson', title: 'Celebration of life for Harold Thompson', eventType: 'memorial', eventDate: '2026-11-14', guestCount: 90, budget: '$4k', services: ['Chairs'], venue: 'St. Mark\'s Fellowship Hall', source: 'Referral', stage: 'won', receivedAt: '2026-10-26T10:00:00', activity: [] },
]

// Proposals keep every version; the client always sees the latest sent one.
// lines: included add-ons; optional lines are upgrades the client may tick in the portal.
export const proposals = [
  {
    id: 'rivera', leadId: 'rivera', status: 'sent',
    versions: [
      {
        n: 1, sentAt: '2026-11-02T15:30:00', packageId: 'gold', discountCents: 0,
        lines: [
          { addonId: 'photo-booth', qty: 1 }, { addonId: 'karaoke', qty: 1 }, { addonId: 'chairs', qty: 140 },
          { addonId: 'photo-magnets', qty: 1 },
        ],
        changeRequest: { by: 'Ana', at: '2026-11-03T20:14:00', text: 'Can photo magnets be an optional add-on instead of included?' },
      },
      {
        n: 2, sentAt: '2026-11-04T11:02:00', packageId: 'gold', discountCents: 0,
        lines: [
          { addonId: 'photo-booth', qty: 1 }, { addonId: 'karaoke', qty: 1 }, { addonId: 'chairs', qty: 140 },
          { addonId: 'photo-magnets', qty: 1, optional: true },
          { addonId: 'extra-karaoke-hour', qty: 1, optional: true },
        ],
      },
    ],
  },
]

// Contracts: created when the client signs (client_sign_contract), countersigned by the planner.
export const contracts = [
  { id: 'acme', leadId: 'acme', eventId: 'acme', clientSignedAt: '2026-09-18T13:00:00', plannerSignedAt: '2026-09-18T17:30:00' },
  { id: 'hope', leadId: 'hope', eventId: 'hope', clientSignedAt: '2026-10-01T10:00:00', plannerSignedAt: '2026-10-01T12:00:00' },
  { id: 'patel', leadId: 'patel', eventId: 'patel', clientSignedAt: '2026-09-01T10:00:00', plannerSignedAt: '2026-09-01T15:00:00' },
  { id: 'thompson', leadId: 'thompson', eventId: 'thompson', clientSignedAt: '2026-10-27T09:00:00', plannerSignedAt: '2026-10-27T11:00:00' },
]

// status: awaiting_countersign | booked | in_planning | final_week | event_day | wrap_up | closed | cancelled
export const events = [
  { id: 'acme', leadId: 'acme', clientId: 'acme', name: 'Acme holiday party', type: 'corporate', date: '2026-12-12', startTime: '19:00', venue: 'The Driskill Ballroom', status: 'in_planning', guestCount: 150, theme: 'gala-night', portalUnlockedAt: '2026-09-18T13:05:00' },
  { id: 'hope', leadId: 'hope', clientId: 'hope', name: 'Hope Church potluck', type: 'potluck', date: '2027-01-09', startTime: '12:00', venue: 'Hope Community Church hall', status: 'booked', guestCount: 200, theme: 'community-potluck', portalUnlockedAt: '2026-10-01T10:00:00' },
  { id: 'patel', leadId: 'patel', clientId: 'patel', name: 'Patel family reunion', type: 'reunion', date: '2027-03-03', startTime: '13:00', venue: 'Zilker Clubhouse', status: 'booked', guestCount: 80, theme: 'throwback', portalUnlockedAt: '2026-09-01T10:05:00' },
  { id: 'thompson', leadId: 'thompson', clientId: 'thompson', name: 'Celebration of life for Harold Thompson', type: 'memorial', date: '2026-11-14', startTime: '11:00', venue: 'St. Mark\'s Fellowship Hall', status: 'final_week', guestCount: 90, theme: 'celebration-of-life', portalUnlockedAt: '2026-10-27T09:05:00' },
]

// Invoices with their payment schedules (installments). Paid = paidAt set.
function invoice(id, number, eventId, totalCents, dues, paidCount) {
  const amounts = splitByPercent(totalCents, [30, 40, 30])
  const labels = ['Deposit 30%', 'Payment 2 · 40%', 'Final · 30%']
  return {
    id, number, eventId, totalCents,
    installments: amounts.map((amountCents, i) => ({
      id: `${id}-${i + 1}`, label: labels[i], dueDate: dues[i], amountCents,
      paidAt: i < paidCount ? `${dues[i]}T12:00:00` : null,
    })),
  }
}
export const invoices = [
  invoice('acme', 1031, 'acme', 1200000, ['2026-09-18', '2026-11-01', '2026-11-28'], 2),
  invoice('hope', 1035, 'hope', 150000, ['2026-10-01', '2026-12-01', '2026-12-26'], 1),
  invoice('patel', 1028, 'patel', 600000, ['2026-09-01', '2027-01-15', '2027-02-17'], 1),
  invoice('thompson', 1040, 'thompson', 400000, ['2026-10-27', '2026-11-06', '2026-11-13'], 1),
]

// The demo Outbox: every email / text / push the app "sent". Links inside open real screens;
// link.role switches the demo to the person the message was for.
export const outbox = [
  {
    id: 'm1', type: 'push', at: '2026-10-28T09:41:00', to: 'LaToya (planner)', from: 'Bella Events · Crowned',
    subject: 'New lead: Ana Rivera', body: 'Wedding · Sat Jun 12, 2027 · 120 guests · $15–20k',
    link: { label: 'Open lead', to: '/app/leads/rivera', role: 'planner' },
  },
  {
    id: 'm2', type: 'email', at: '2026-10-28T09:41:00', to: 'ana.rivera@gmail.com', from: 'Bella Events',
    subject: 'Thanks, Ana! Let\'s talk about your wedding', body: 'We got your inquiry for Sat, Jun 12, 2027. Pick a time for a free 30-minute consult and we\'ll talk through your ideas.',
    link: { label: 'Book your consult', to: '/b/bella-events/book', role: 'client' },
  },
  {
    id: 'm3', type: 'email', at: '2026-11-04T11:02:00', to: 'ana.rivera@gmail.com', from: 'Bella Events',
    subject: 'Your proposal (v2) is ready', body: 'Photo magnets are now an optional add-on, as you asked. Review the proposal, then accept, sign and pay your deposit in one sitting.',
    link: { label: 'View your proposal', to: '/portal/proposal', role: 'client' }, foot: 'This link is just for you and expires in 7 days.',
  },
  {
    id: 'm4', type: 'push', at: '2026-11-05T16:40:00', to: 'LaToya (planner)', from: 'Bella Events · Crowned',
    subject: 'New lead: Linh Nguyen', body: 'Baby shower · Sat Jan 23, 2027 · 35 guests · $2–3k',
    link: { label: 'Open lead', to: '/app/leads/nguyen', role: 'planner' },
  },
]

/** A fresh copy of the whole world. Called once on load (and by tests). */
export function createSeedState() {
  return structuredClone({
    business, team, packages, addons, clients, leads, proposals, contracts, events, invoices, outbox,
  })
}
