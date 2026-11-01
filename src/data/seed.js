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
import {
  defaultSite, defaultInvitation, eventDetails, guests, files, approvals, questionnaires, threads, moreAppointments,
} from './seedPlanning'
import { vendors, eventVendors, timeline, budgetLines, equipment, kits, reservations, ALWAYS_BRING, shifts, potluckSignups, volunteerSignups, defaultPotluck, defaultVolunteer } from './seedLogistics'
import { songs, songRequests, defaultKaraoke, karaokeDetails } from './seedKaraoke'
import { photos, boothSessions, prints, recipes, defaultBooth, boothDetails } from './seedBooth'
import { donations, bidders, bids, sponsors, defaultFund, defaultAuction, defaultPaddle, defaultSponsorship, givingDetails } from './seedGiving'
import { tickets, waitlist, seats, avoid, defaultFloorPlan, defaultTicketing, seatingDetails, ticketingDetails } from './seedSeating'
import { marketing, feedback } from './seedGrow'

export const business = {
  id: 'bella-events',
  name: 'Bella Events',
  slug: 'bella-events',
  initials: 'BE',
  logo: null,                       // data URL of an uploaded logo (null = show initials)
  email: 'hello@bellaevents.com',
  phone: '(512) 555-0142',
  city: 'Austin, TX',
  timezone: 'America/Chicago',
  customDomain: 'events.bellaevents.com',
  brandColors: ['#A3336A', '#2E1A3A'],  // first = main brand color (schema: businesses.brand_colors)
  taxRatePercent: 8,
  depositPercent: 30,
  // Payment schedule for new invoices: deposit, then the rest (percent of the total)
  paymentSchedule: [
    { label: 'Deposit 30%', percent: 30, due: 'at signing', daysBefore: null },
    { label: 'Payment 2 · 40%', percent: 40, due: '60 days before', daysBefore: 60 },
    { label: 'Final · 30%', percent: 30, due: '14 days before', daysBefore: 14 },
  ],
  // Public booking page rules (PL-2.4), like Calendly: open times, buffers, a daily limit
  booking: { consultMinutes: 30, bufferMinutes: 15, dailyLimit: 3, weekdays: [1, 2, 3, 4, 5], times: ['10:00', '11:30', '14:00', '16:30'] },
  holdDays: 7,                      // "Hold date" on a lead lasts this long
  gearBufferDays: 1,                // gear isn't free again until a day after an event (cleaning, turnaround)
  alwaysBring: ALWAYS_BRING,        // on every pack list (PL-6.3)
  // The planner's own invitation looks, reusable on any event (PL-5.5)
  quickbooks: null,                 // { connectedAt, lastSyncAt, invoices, payments } once connected (PL-9.1)
  eventTemplates: [],               // events saved as templates (PL-9.3)
  inviteTemplates: [{ id: 'tpl-bella', name: 'Bella signature', design: { themeId: 'elegant-wedding', font: 'Playfair Display', accent: '#A3336A', photo: null, layout: 'classic', envelope: true, music: 'piano' } }],
  staffDressCode: 'All black, closed-toe shoes, name badge',   // on every call sheet (ST-3.1)
  // Contract template (PL-3.3): merge fields are filled from the accepted proposal
  contractTerms: {
    cancellation: 'The deposit is non-refundable. Cancel 90 or more days before the event and payments after the deposit are refunded in full; 30–89 days before, 50% is refunded; under 30 days, nothing is refunded. You may move your date once at no charge, subject to availability.',
    lateFee: true,                  // the contract allows a late fee (Invoice option)
  },
  paymentProvider: 'stripe',        // 'stripe' | 'square' | null (null = not connected: check/cash only)
  calendarProvider: null,           // 'google' | 'apple' | 'outlook' | null
  inquiryFormShared: false,         // getting-started checklist item
  // Onboarding wizard: which steps are done (Dashboard checklist resumes from here)
  onboarding: { business: true, payments: true, packages: true, calendar: false, team: true, templates: true },
  templates: {
    checklists: { wedding: 'Wedding · 12 months', birthday: 'Birthday · 8 weeks', baby_shower: 'Shower · 6 weeks', bridal_shower: 'Shower · 6 weeks', corporate: 'Corporate · 10 weeks', fundraiser: 'Fundraiser · 16 weeks', memorial: 'Memorial · 2 weeks', other: 'General · 8 weeks' },
    messages: {
      autoReply: 'Thanks for reaching out! We got your inquiry and will reply within one business day. Want to talk sooner? Book a free consult here: {booking_link}',
      paymentReminder: 'Hi {first_name}, a friendly reminder that {amount} for {event} is due {due_date}. Pay securely here: {pay_link}',
    },
  },
}

// Permission switches per person (schema: memberships.permissions). Profit is owner-only.
export const PERMISSIONS = [
  { id: 'see_budgets', label: 'See event budgets' },
  { id: 'see_profit', label: 'See profit margins', ownerOnly: true },
  { id: 'take_payments', label: 'Take payments (tap-to-pay)' },
  { id: 'edit_vendors', label: 'Edit vendors' },
]
export const JOB_TITLES = ['Lead coordinator', 'Coordinator', 'KJ', 'Photo booth attendant', 'Server', 'Bartender']

// The team (schema: memberships). role: owner | coordinator | staff; status: invited | active | deactivated
export const team = [
  { id: 'latoya', name: 'LaToya Simon', role: 'owner', jobTitle: 'Owner', email: 'latoya@bellaevents.com', phone: '(512) 555-0142', status: 'active', twoFactor: 'passkey', skills: ['Coordinator'], hourlyCents: 0,
    permissions: { see_budgets: true, see_profit: true, take_payments: true, edit_vendors: true } },
  { id: 'devon', name: 'Devon Brooks', role: 'coordinator', jobTitle: 'Lead coordinator', email: 'devon@bellaevents.com', phone: '(512) 555-0177', status: 'active', skills: ['Coordinator', 'Setup crew'], hourlyCents: 3500,
    availability: { weekdays: [0, 1, 2, 3, 4, 5, 6], off: [] },
    permissions: { see_budgets: true, see_profit: false, take_payments: true, edit_vendors: true } },
  { id: 'sam', name: 'Sam Ortiz', role: 'staff', jobTitle: 'Photo booth attendant', email: 'sam.ortiz@gmail.com', phone: '(512) 555-0109', status: 'active',
    emergencyContact: 'Maria Ortiz · (512) 555-0110', skills: ['Photo booth', 'Serving', 'Setup crew'], shirtSize: 'M', photo: null, hourlyCents: 2200,
    availability: { weekdays: [0, 4, 5, 6], off: ['2026-11-21'] },   // Thu–Sun; away Nov 21 (ST-2.1)
    permissions: { see_budgets: false, see_profit: false, take_payments: false, edit_vendors: false } },
  // Invited Nov 4, hasn't joined yet: the 💬 team invite in the Outbox opens /join/inv-jo (ST-1.1)
  { id: 'jo', name: 'Jo Kim', role: 'staff', jobTitle: 'KJ', email: '', phone: '(512) 555-0199', status: 'invited', inviteToken: 'inv-jo',
    skills: [], shirtSize: '', photo: null, hourlyCents: 2500,
    permissions: { see_budgets: false, see_profit: false, take_payments: false, edit_vendors: false } },
  // Product Phase 2: more crew, so shifts have people to suggest
  { id: 'marcus', name: 'Marcus Hill', role: 'staff', jobTitle: 'Server', email: '', phone: '(512) 555-0121', status: 'active',
    skills: ['Serving', 'Bartending', 'Setup crew'], shirtSize: 'L', photo: null, hourlyCents: 2000, availability: { weekdays: [0, 1, 2, 3, 4, 5, 6], off: ['2026-11-14'] },
    permissions: { see_budgets: false, see_profit: false, take_payments: false, edit_vendors: false } },
  { id: 'keisha', name: 'Keisha Grant', role: 'staff', jobTitle: 'KJ', email: 'keisha.g@gmail.com', phone: '(512) 555-0186', status: 'active',
    skills: ['KJ', 'Serving'], shirtSize: 'S', photo: null, hourlyCents: 2500, availability: { weekdays: [0, 5, 6], off: [] },
    permissions: { see_budgets: false, see_profit: false, take_payments: false, edit_vendors: false } },
]

export const packages = [
  { id: 'silver', name: 'Silver', priceCents: 800000, description: 'Day-of coordination, a timeline and one planning meeting.', archived: false },
  { id: 'gold', name: 'Gold', priceCents: 1100000, description: 'Partial planning: vendor booking, three planning meetings and day-of coordination.', archived: false },
  { id: 'platinum', name: 'Platinum', priceCents: 1550000, description: 'Full planning and design, unlimited meetings and day-of coordination.', archived: false },
]

// Add-ons the planner can put on a proposal. `owned` = how many the business has (gear check).
export const addons = [
  { id: 'photo-booth', name: 'Photo booth (4 hrs)', priceCents: 150000, unit: 'each', owned: 2, archived: false },
  { id: 'karaoke', name: 'Karaoke + KJ (3 hrs)', priceCents: 90000, unit: 'each', owned: 1, archived: false },
  { id: 'chairs', name: 'Chairs', priceCents: 250, unit: 'chair', owned: 120, archived: false },
  { id: 'photo-magnets', name: 'Photo magnets', priceCents: 60000, unit: 'each', owned: null, archived: false },
  { id: 'extra-karaoke-hour', name: 'Extra karaoke hour', priceCents: 25000, unit: 'hour', owned: null, archived: false },
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
  { id: 'garza', name: 'Elena Garza', partner: 'Mateo Reyes', email: 'elena.garza@gmail.com', phone: '(512) 555-0126' },
  { id: 'morales', name: 'Rosa Morales', email: 'rosa.morales@gmail.com', phone: '(512) 555-0103' },
  { id: 'westlake', name: 'Karen Holt', company: 'Westlake Elementary PTA', email: 'pta@westlakeelem.org', phone: '(512) 555-0158' },
  { id: 'okafor', name: 'Chidi Okafor', email: 'chidi.okafor@gmail.com', phone: '(512) 555-0191' },
]

// Event types (schema: events.event_type) with the words people see
export const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding' }, { id: 'birthday', label: 'Birthday' }, { id: 'baby_shower', label: 'Baby shower' },
  { id: 'bridal_shower', label: 'Bridal shower' }, { id: 'corporate', label: 'Corporate' }, { id: 'fundraiser', label: 'Fundraiser' },
  { id: 'reunion', label: 'Reunion' }, { id: 'potluck', label: 'Potluck' }, { id: 'church', label: 'Church event' },
  { id: 'school', label: 'School event' }, { id: 'holiday', label: 'Holiday party' }, { id: 'memorial', label: 'Memorial' },
  { id: 'other', label: 'Something else' },
]
export const eventTypeLabel = (id) => EVENT_TYPES.find((t) => t.id === id)?.label ?? 'Event'

// Starter checklists applied at countersign (PL-1.7, PL-3.4): due N days before the event
export const CHECKLIST_ITEMS = {
  wedding: [['Send the welcome questionnaire', 210], ['Venue walkthrough', 180], ['Share the mood board', 150], ['Confirm vendors', 120],
    ['Send invitations', 100], ['Lock the final headcount', 7], ['Day-of timeline to vendors', 5], ['Final walkthrough', 3]],
  corporate: [['Send the welcome questionnaire', 60], ['Confirm the venue layout', 45], ['Book entertainment', 40], ['Lock the final headcount', 7], ['Day-of timeline to the venue', 5]],
  memorial: [['Confirm the order of service', 10], ['Print the programs', 3], ['Confirm the reception food', 5]],
  default: [['Send the welcome questionnaire', 50], ['Confirm the venue', 40], ['Send invitations', 30], ['Lock the final headcount', 7], ['Day-of timeline', 3]],
}
export const MANUAL_PAYMENT_METHODS = ['Cash', 'Check', 'Venmo', 'Zelle', 'Cash App']

// Inquiry form choices (CL-1.1)
export const SERVICES = ['Full planning', 'Photo booth', 'Karaoke', 'Rentals', 'Potluck organizer', 'Donations', 'Décor', 'Chairs']
export const BUDGET_RANGES = ['Under $2k', '$2–4k', '$4–8k', '$8–15k', '$15–20k', '$20k+', 'Not sure yet']
export const LEAD_SOURCES = ['Instagram', 'Facebook', 'Google', 'The Knot', 'Referral', 'Booking page', 'Other']

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
  { id: 'garza', clientId: 'garza', title: 'Garza wedding', eventType: 'wedding', eventDate: '2027-09-18', guestCount: 150, budget: '$9–11k', services: ['Photo booth'], venue: 'Laguna Gloria', source: 'Instagram', stage: 'won', receivedAt: '2026-10-12T10:00:00', activity: [] },
  { id: 'morales', clientId: 'morales', title: 'Morales quinceañera', eventType: 'birthday', eventDate: '2026-09-12', guestCount: 160, budget: '$8k', services: ['Photo booth', 'Karaoke'], venue: 'Salón Las Palmas', source: 'Referral', stage: 'won', receivedAt: '2026-05-02T10:00:00', activity: [] },
  { id: 'westlake', clientId: 'westlake', title: 'Westlake PTA gala', eventType: 'fundraiser', eventDate: '2026-10-03', guestCount: 220, budget: '$10k', services: ['Photo booth'], venue: 'Westlake Elementary gym', source: 'Google', stage: 'won', receivedAt: '2026-06-15T10:00:00', activity: [] },
  { id: 'okafor', clientId: 'okafor', title: 'Okafor 50th birthday', eventType: 'birthday', eventDate: '2026-10-17', guestCount: 60, budget: '$4k', services: ['Karaoke'], venue: 'Home (Pflugerville)', source: 'Referral', stage: 'won', receivedAt: '2026-08-20T10:00:00', activity: [] },
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
  { id: 'garza', leadId: 'garza', eventId: 'garza', clientSignedAt: '2026-11-02T13:20:00', plannerSignedAt: '2026-11-02T15:00:00' },
  { id: 'morales', leadId: 'morales', eventId: 'morales', clientSignedAt: '2026-05-20T10:00:00', plannerSignedAt: '2026-05-20T12:00:00' },
  { id: 'westlake', leadId: 'westlake', eventId: 'westlake', clientSignedAt: '2026-07-01T10:00:00', plannerSignedAt: '2026-07-01T12:00:00' },
  { id: 'okafor', leadId: 'okafor', eventId: 'okafor', clientSignedAt: '2026-09-01T10:00:00', plannerSignedAt: '2026-09-01T12:00:00' },
]

// status: awaiting_countersign | booked | in_planning | final_week | event_day | wrap_up | closed | cancelled
export const events = [
  { id: 'acme', leadId: 'acme', clientId: 'acme', name: 'Acme holiday party', type: 'corporate', date: '2026-12-12', startTime: '19:00', venue: 'The Driskill Ballroom', status: 'in_planning', guestCount: 150, theme: 'gala-night', portalUnlockedAt: '2026-09-18T13:05:00' },
  { id: 'hope', leadId: 'hope', clientId: 'hope', name: 'Hope Church potluck', type: 'potluck', date: '2027-01-09', startTime: '12:00', venue: 'Hope Community Church hall', status: 'booked', guestCount: 200, theme: 'community-potluck', portalUnlockedAt: '2026-10-01T10:00:00' },
  { id: 'patel', leadId: 'patel', clientId: 'patel', name: 'Patel family reunion', type: 'reunion', date: '2027-03-03', startTime: '13:00', venue: 'Zilker Clubhouse', status: 'booked', guestCount: 80, theme: 'throwback', portalUnlockedAt: '2026-09-01T10:05:00' },
  { id: 'garza', leadId: 'garza', clientId: 'garza', name: 'Garza wedding', type: 'wedding', date: '2027-09-18', startTime: '17:00', venue: 'Laguna Gloria', status: 'booked', guestCount: 150, theme: 'boho-garden', portalUnlockedAt: '2026-11-02T13:25:00' },
  // Past events (closed), for the pipeline and the Events list's "Past" tab
  { id: 'morales', leadId: 'morales', clientId: 'morales', name: 'Morales quinceañera', type: 'birthday', date: '2026-09-12', startTime: '18:00', venue: 'Salón Las Palmas', status: 'closed', guestCount: 160, theme: 'quinceanera', portalUnlockedAt: '2026-05-20T10:05:00' },
  { id: 'westlake', leadId: 'westlake', clientId: 'westlake', name: 'Westlake PTA gala', type: 'fundraiser', date: '2026-10-03', startTime: '18:30', venue: 'Westlake Elementary gym', status: 'closed', guestCount: 220, theme: 'gala-night', portalUnlockedAt: '2026-07-01T10:05:00' },
  { id: 'okafor', leadId: 'okafor', clientId: 'okafor', name: 'Okafor 50th birthday', type: 'birthday', date: '2026-10-17', startTime: '19:00', venue: 'Home (Pflugerville)', status: 'closed', guestCount: 60, theme: 'throwback', portalUnlockedAt: '2026-09-01T10:05:00' },
  { id: 'thompson', leadId: 'thompson', clientId: 'thompson', name: 'Celebration of life for Harold Thompson', type: 'memorial', date: '2026-11-14', startTime: '11:00', venue: 'St. Mark\'s Fellowship Hall', status: 'final_week', guestCount: 90, theme: 'celebration-of-life', portalUnlockedAt: '2026-10-27T09:05:00' },
]

// Invoices with their payment schedules (installments). Paid = paidAt set.
// Clients who turned on autopay
const hasAutopay = (id) => ['acme', 'garza'].includes(id)
function invoice(id, number, eventId, totalCents, dues, paidCount) {
  const amounts = splitByPercent(totalCents, [30, 40, 30])
  const labels = ['Deposit 30%', 'Payment 2 · 40%', 'Final · 30%']
  return {
    id, number, eventId, totalCents,
    installments: amounts.map((amountCents, i) => ({
      id: `${id}-${i + 1}`, label: labels[i], dueDate: dues[i], amountCents,
      paidAt: i < paidCount ? `${dues[i]}T12:00:00` : null,
      method: i < paidCount ? 'Visa ·4242' : null,
    })),
    refunds: [], failedAttempts: 0,
    // A refundable security deposit held on the client's card (PL-8.2): held → released, or applied to damage
    securityDeposit: ['acme', 'thompson'].includes(id) ? { amountCents: 25000, status: 'held', method: 'Visa ·4242' } : null,
    options: { autopay: hasAutopay(id), passCardFee: false, lateFee: false, remindersPaused: false },
  }
}
export const invoices = [
  invoice('acme', 1031, 'acme', 1200000, ['2026-09-18', '2026-11-01', '2026-11-28'], 2),
  invoice('hope', 1035, 'hope', 150000, ['2026-10-01', '2026-12-01', '2026-12-26'], 1),
  invoice('patel', 1028, 'patel', 600000, ['2026-09-01', '2027-01-15', '2027-02-17'], 1),
  invoice('thompson', 1040, 'thompson', 400000, ['2026-10-27', '2026-11-06', '2026-11-13'], 1),
  invoice('garza', 1041, 'garza', 965000, ['2026-11-02', '2027-05-18', '2027-08-18'], 1),
  invoice('morales', 1012, 'morales', 800000, ['2026-05-20', '2026-07-12', '2026-08-29'], 3),
  invoice('westlake', 1019, 'westlake', 1000000, ['2026-07-01', '2026-08-15', '2026-09-19'], 3),
  invoice('okafor', 1026, 'okafor', 400000, ['2026-09-01', '2026-09-20', '2026-10-03'], 3),
]

// Checklist tasks per event (Event Hub › Tasks builds on these in Phase 4)
const task = (id, eventId, title, due, assignee = 'latoya') => ({ id, eventId, title, due, assignee, done: false })
export const tasks = [
  task('t1', 'acme', 'Confirm final headcount with Priya', '2026-11-04'),   // late
  task('t2', 'acme', 'Book the DJ', '2026-11-10', 'devon'),
  task('t3', 'acme', 'Send the karaoke song list', '2026-11-20', 'devon'),
  task('t4', 'acme', 'Pick up the photo booth backdrop', '2026-12-10', 'sam'),
  task('t5', 'acme', 'Day-of timeline to the venue', '2026-12-05'),
  task('t6', 'hope', 'Confirm chair delivery time', '2026-12-15', 'devon'),
  task('t7', 'hope', 'Share the sign-up sheet link', '2026-12-01'),
  task('t8', 'hope', 'Print table cards', '2027-01-05', 'sam'),
  task('t9', 'patel', 'Tasting with the caterer', '2026-11-07'),
  task('t10', 'patel', 'Send the save-the-date', '2026-12-01'),
  task('t11', 'thompson', 'Print the memorial programs', '2026-11-11'),
  task('t12', 'thompson', 'Set up the photo slideshow', '2026-11-13', 'devon'),
  task('t13', 'thompson', 'Confirm the reception food order', '2026-11-09'),
  task('t14', 'garza', 'Send the welcome questionnaire', '2026-11-09'),
  task('t15', 'acme', 'Approve the dinner menu', '2026-11-09', 'client'),
]

// Consults, site visits, tastings and pickups (Dashboard "Today & this week", Calendar)
export const appointments = [
  { id: 'a1', at: '2026-11-06T10:00:00', title: 'Site visit', with: 'Lee bridal shower', to: '/app/leads/lee' },
  { id: 'a2', at: '2026-11-07T11:00:00', title: 'Tasting', with: 'Patel family reunion', to: '/app/events/patel' },
  { id: 'a3', at: '2026-11-07T16:00:00', title: 'Gear pickup', with: 'Acme holiday party', to: '/app/events/acme' },
  { id: 'a4', at: '2026-11-09T13:00:00', title: 'Call', with: 'Nguyen (new lead)', to: '/app/leads/nguyen' },
  { id: 'a5', at: '2026-11-19T15:00:00', title: 'Planning meeting', with: 'Garza wedding', to: '/app/events/garza' },
  ...moreAppointments,
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
    id: 'm6', type: 'sms', at: '2026-11-04T15:20:00', to: 'Jo Kim · (512) 555-0199', from: 'Bella Events',
    subject: 'Team invite', body: 'Bella Events invited you to join their team on Crowned as KJ. Tap to accept:',
    link: { label: 'Accept the invite', to: '/join/inv-jo', role: 'staff' },
  },
  {
    id: 'm5', type: 'sms', at: '2026-11-01T09:00:00', to: 'Dana Lee · (512) 555-0303', from: 'Bella Events',
    subject: 'Invitation', body: 'You\'re invited to the Acme Robotics holiday party! Saturday, December 12, 7 PM at The Driskill Ballroom. RSVP by Nov 28:',
    link: { label: 'Open invitation', to: '/i/acme-g8-t', role: 'guest' },
  },
  {
    id: 'm4', type: 'push', at: '2026-11-05T16:40:00', to: 'LaToya (planner)', from: 'Bella Events · Crowned',
    subject: 'New lead: Linh Nguyen', body: 'Baby shower · Sat Jan 23, 2027 · 35 guests · $2–3k',
    link: { label: 'Open lead', to: '/app/leads/nguyen', role: 'planner' },
  },
]

/** A fresh copy of the whole world. Called once on load (and by tests). */
/** Every event carries its website, invitation and planning details (Phase 4). */
export const withPlanning = (event) => ({
  venueInfo: { address: '', loadIn: '', wifi: '' }, costsCents: 0, headcount: null, log: [],
  site: defaultSite(event), invitation: defaultInvitation(), potluck: defaultPotluck(), volunteer: defaultVolunteer(),
  karaoke: { ...defaultKaraoke(), ...(karaokeDetails[event.id] ?? {}) },
  booth: { ...defaultBooth(), ...(boothDetails[event.id] ?? {}) },
  fund: defaultFund(), auction: defaultAuction(), paddle: defaultPaddle(), sponsorship: defaultSponsorship(),
  ...(givingDetails[event.id] ?? {}),
  floorPlan: defaultFloorPlan(), ...(seatingDetails[event.id] ?? {}),
  ticketing: { ...defaultTicketing(), ...(ticketingDetails[event.id] ?? {}) },
  ...event, ...(eventDetails[event.id] ?? {}),
})

export function createSeedState() {
  return structuredClone({
    business, team, packages, addons, leads, proposals, contracts, events: events.map(withPlanning), invoices, tasks, appointments,
    outbox: [...outbox].sort((a, b) => b.at.localeCompare(a.at)),
    guests: guests.map((g) => ({ tableId: seats[g.id] ?? null, avoid: avoid[g.id] ?? [], ...g })), files, approvals, questionnaires, threads, requests: [],
    vendors, eventVendors, timeline, budgetLines, equipment, kits, reservations, shifts, incidents: [], potluckSignups, volunteerSignups, songs, songRequests, photos, boothSessions, prints, recipes, donations, bidders, bids, sponsors, tickets, waitlist, feedback,
    clients: clients.map((c) => ({ ...c, marketing: marketing[c.id] ?? { optIn: false, dates: [], sent: [] } })),
  })
}

/**
 * A brand-new business right after sign up: nothing set up yet, so the Dashboard
 * shows the getting-started checklist and the onboarding wizard has work to do.
 */
export function createNewBusinessState({ ownerName, businessName, email }) {
  const slug = businessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-business'
  const initials = businessName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'MB'
  return {
    business: {
      ...structuredClone(business),
      id: slug, slug, name: businessName, initials, logo: null, email, phone: '', city: '', customDomain: '',
      paymentProvider: null, calendarProvider: null, inquiryFormShared: false, inviteTemplates: [], eventTemplates: [], quickbooks: null,
      onboarding: { business: false, payments: false, packages: false, calendar: false, team: false, templates: false },
    },
    team: [{
      id: 'owner', name: ownerName, role: 'owner', jobTitle: 'Owner', email, phone: '', status: 'active', twoFactor: null,
      permissions: { see_budgets: true, see_profit: true, take_payments: true, edit_vendors: true },
    }],
    packages: [], addons: [], clients: [], leads: [], proposals: [], contracts: [], events: [], invoices: [], tasks: [], appointments: [], outbox: [],
    guests: [], files: [], approvals: [], questionnaires: [], threads: [], requests: [],
    vendors: [], eventVendors: [], timeline: [], budgetLines: [], equipment: [], kits: [], reservations: [], shifts: [], incidents: [], potluckSignups: [], volunteerSignups: [], songs: structuredClone(songs), songRequests: [], photos: [], boothSessions: [], prints: [], recipes: [], donations: [], bidders: [], bids: [], sponsors: [], tickets: [], waitlist: [], feedback: [],
  }
}
