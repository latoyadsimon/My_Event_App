// =====================================================================
// Seed data for planning an event (Phases 4–6): guests, the event website,
// invitations, files and mood boards, message threads, approvals and
// questionnaires. Kept apart from seed.js so each file stays readable.
//
// The busiest event on Thu Nov 5, 2026 is the Acme holiday party
// (Sat Dec 12, 5 weeks out): invitations went out Nov 1, RSVPs are coming in.
// The Thompson celebration of life (Nov 14) shows the respectful tone.
// =====================================================================

/** Event website + RSVP settings (PL-5.2). Every event gets one; defaults are sensible. */
export function defaultSite(event) {
  return {
    welcome: '',
    sections: { schedule: true, dressCode: true, hotel: false, faq: true },
    schedule: [],
    dressCode: '',
    hotel: '',
    faq: [],
    fundLink: '',
    rsvpCutoff: null,
    meals: event.type === 'memorial' ? [] : ['Chicken', 'Fish', 'Vegetarian'],
    askAllergies: true,
    songRequest: !['memorial', 'corporate'].includes(event.type),
    customQuestions: [],
    defaultPlusOnes: 0,
    privacy: 'private',
    password: '',
    allowLate: false,
  }
}

/** Invitation wording + approval + sends (PL-5.3). */
export const defaultInvitation = () => ({
  wording: { save_the_date: '', invitation: '', reminder: '', thank_you: '' },
  approval: null,     // { status: 'requested' | 'approved' | 'changes', by, at, comment }
  sends: [],          // { id, kind, at, channels, count }
  design: defaultDesign(),
})

/**
 * The invitation designer's choices (PL-5.5). null = use the event theme's own.
 * layout: classic | photo-top · music: null | 'piano' | 'strings' | 'acoustic'
 */
export const defaultDesign = () => ({ themeId: null, font: null, accent: null, photo: null, layout: 'classic', envelope: false, music: null })
/** An event's design, filling in anything missing (older events had none). */
export const designOf = (event) => ({ ...defaultDesign(), ...(event.invitation?.design ?? {}) })

// ---- Per-event details (merged into seed events) ----
export const eventDetails = {
  acme: {
    venueInfo: { address: '604 Brazos St, Austin, TX 78701', loadIn: 'Load in through the Brazos St service door from 3 PM. Elevator to the ballroom level.', wifi: 'Driskill-Events / password at the front desk' },
    costsCents: 720000,                 // estimated vendor + staff costs (Money tab, owner-only profit)
    headcount: null,
    log: [{ at: '2026-09-18T17:30:00', text: 'Booked (contract countersigned)' }, { at: '2026-11-01T09:00:00', text: 'Invitations sent to 16 households' }],
    site: {
      welcome: 'Join the whole Acme Robotics team for an evening of dinner, karaoke and a photo booth to celebrate a great year.',
      sections: { schedule: true, dressCode: true, hotel: false, faq: true },
      schedule: [{ time: '7:00 PM', text: 'Cocktails' }, { time: '8:00 PM', text: 'Dinner and awards' }, { time: '9:30 PM', text: 'Karaoke and photo booth' }],
      dressCode: 'Cocktail attire',
      hotel: '',
      faq: [{ q: 'Can I bring a guest?', a: 'Yes, one guest per employee. Add them when you RSVP.' }, { q: 'Is there parking?', a: 'Valet at the Brazos St entrance, paid by Acme.' }],
      fundLink: '',
      rsvpCutoff: '2026-11-28',
      meals: ['Chicken', 'Fish', 'Vegetarian'],
      askAllergies: true, songRequest: true, customQuestions: ['Team or department'],
      defaultPlusOnes: 1, privacy: 'private', password: '', allowLate: false,
    },
    invitation: {
      wording: {
        save_the_date: 'Save the date: the Acme Robotics holiday party is Saturday, December 12 at The Driskill.',
        invitation: 'You\'re invited to the Acme Robotics holiday party! Saturday, December 12, 7 PM at The Driskill Ballroom. Dinner, karaoke and a photo booth. Please RSVP by November 28.',
        reminder: 'One week to go! The holiday party is Saturday at 7 PM at The Driskill. Valet at the Brazos St entrance. Cocktail attire.',
        thank_you: '',
      },
      approval: { status: 'approved', by: 'Priya Shah', at: '2026-10-28T14:00:00' },
      sends: [{ id: 'send-acme-1', kind: 'invitation', at: '2026-11-01T09:00:00', channels: ['email', 'sms'], count: 16 }],
    },
  },
  thompson: {
    minutes: 180,                       // service + reception, 11 AM to 2 PM
    venueInfo: { address: '1100 Lavaca St, Austin, TX 78701', loadIn: 'Side entrance on 11th St. The hall is open from 9 AM.', wifi: 'StMarks-Guest (no password)' },
    costsCents: 260000,
    headcount: null,
    log: [{ at: '2026-10-27T11:00:00', text: 'Booked (contract countersigned)' }, { at: '2026-10-30T10:00:00', text: 'Announcement shared with family and friends' }],
    site: {
      welcome: 'Please join us as we remember and celebrate the life of Harold Thompson, a loving husband, father and friend.',
      sections: { schedule: true, dressCode: false, hotel: false, faq: true },
      schedule: [{ time: '11:00 AM', text: 'Service' }, { time: '12:30 PM', text: 'Reception and sharing of memories' }],
      dressCode: '', hotel: '',
      faq: [{ q: 'Can I share a memory?', a: 'Yes. There will be time to share at the reception, and a memory book at the entrance.' }],
      fundLink: 'https://www.gofundme.com/', rsvpCutoff: '2026-11-10', meals: [], askAllergies: true, songRequest: false, customQuestions: [],
      defaultPlusOnes: 1, privacy: 'private', password: '', allowLate: true,
    },
    invitation: {
      wording: { save_the_date: '', invitation: 'With love, the Thompson family invites you to a celebration of the life of Harold Thompson, Saturday, November 14 at 11 AM, St. Mark\'s Fellowship Hall.', reminder: '', thank_you: '' },
      approval: { status: 'approved', by: 'Denise Thompson', at: '2026-10-29T16:00:00' },
      sends: [{ id: 'send-thompson-1', kind: 'invitation', at: '2026-10-30T10:00:00', channels: ['email', 'sms'], count: 8 }],
    },
  },
  // Product Phase 2: a public church potluck with sign-ups (PL-5.6, GU-3.1, GU-3.2)
  hope: {
    venueInfo: { address: '2100 E 12th St, Austin, TX 78702', loadIn: 'Kitchen door on the east side. Tables are set by 11 AM.', wifi: 'HopeGuest' },
    costsCents: 60000,
    site: {
      ...defaultSite({ type: 'potluck' }),
      welcome: 'Our New Year potluck! Bring a dish to share (sign up so we get a little of everything) and lend a hand if you can.',
      schedule: [{ time: '12:00 PM', text: 'Blessing and lunch' }, { time: '1:30 PM', text: 'Kids\' games and dessert' }],
      privacy: 'public', rsvpCutoff: '2027-01-06', meals: [], songRequest: false,
    },
    potluck: {
      enabled: true, dropOff: '11:15',
      // per = one dish for every N people expected
      categories: [{ id: 'mains', name: 'Main dishes', per: 10 }, { id: 'sides', name: 'Sides', per: 8 }, { id: 'salads', name: 'Salads', per: 12 }, { id: 'desserts', name: 'Desserts', per: 10 }, { id: 'drinks', name: 'Drinks', per: 20 }],
    },
    volunteer: {
      enabled: true,
      slots: [{ id: 'setup', name: 'Setup', time: '10:00', needed: 6 }, { id: 'greeting', name: 'Greeting', time: '11:30', needed: 2 }, { id: 'serving', name: 'Serving', time: '12:00', needed: 8 }, { id: 'kids', name: 'Kids\' table', time: '12:00', needed: 3 }, { id: 'cleanup', name: 'Cleanup', time: '14:00', needed: 6 }],
    },
  },
}

// ---- Guests: one row per household (PL-5.1). size = invited people incl. plus-ones ----
const g = (id, eventId, name, contact, extra = {}) => ({
  id, eventId, name, email: contact.includes('@') ? contact : '', phone: contact.includes('@') ? '' : contact,
  plusOnes: 0, tags: [], notes: '', gift: '', allergies: '', songRequest: '', answers: {},
  invite: 'not_sent', rsvp: null, attending: 0, meals: {}, respondedAt: null, addedBy: 'planner', token: `${id}-t`,
  ...extra,
})
const sent = (status = 'delivered') => ({ invite: status, invitedAt: '2026-11-01T09:00:00' })
const yes = (n, meals, at = '2026-11-03T12:00:00', extra = {}) => ({ rsvp: 'attending', attending: n, meals, respondedAt: at, invite: 'opened', invitedAt: '2026-11-01T09:00:00', ...extra })

export const guests = [
  g('acme-g1', 'acme', 'Priya Shah', 'pshah@acmerobotics.com', { plusOnes: 1, tags: ['VIP', 'host'], ...yes(2, { Chicken: 1, Vegetarian: 1 }, '2026-11-01T10:00:00') }),
  g('acme-g2', 'acme', 'Marcus Webb', 'mwebb@acmerobotics.com', { plusOnes: 1, tags: ['engineering'], ...yes(2, { Fish: 2 }), songRequest: 'September' }),
  g('acme-g3', 'acme', 'Jen Alvarez', '(512) 555-0301', { plusOnes: 1, tags: ['sales'], ...yes(1, { Chicken: 1 }), allergies: 'Peanuts' }),
  g('acme-g4', 'acme', 'Tom Nguyen', 'tnguyen@acmerobotics.com', { plusOnes: 1, tags: ['engineering'], ...yes(2, { Chicken: 1, Fish: 1 }) }),
  g('acme-g5', 'acme', 'Alicia Brown', '(512) 555-0302', { plusOnes: 1, tags: ['operations'], ...yes(2, { Vegetarian: 2 }), allergies: 'Shellfish' }),
  g('acme-g6', 'acme', 'Sean O\'Neil', 'soneil@acmerobotics.com', { plusOnes: 1, tags: ['sales'], rsvp: 'declined', respondedAt: '2026-11-02T08:00:00', invite: 'opened', invitedAt: '2026-11-01T09:00:00' }),
  g('acme-g7', 'acme', 'Ravi Kumar', 'rkumar@acmerobotics.com', { plusOnes: 1, tags: ['engineering'], rsvp: 'maybe', respondedAt: '2026-11-04T19:00:00', invite: 'opened', invitedAt: '2026-11-01T09:00:00' }),
  g('acme-g8', 'acme', 'Dana Lee', '(512) 555-0303', { plusOnes: 1, tags: ['design'], ...sent('opened') }),
  g('acme-g9', 'acme', 'Chris Patel', 'cpatel@acmerobotics.com', { plusOnes: 1, tags: ['engineering'], ...sent() }),
  g('acme-g10', 'acme', 'Morgan Diaz', 'mdiaz@acmerobotics.com', { plusOnes: 1, tags: ['finance'], ...sent('bounced') }),
  g('acme-g11', 'acme', 'Kelly Fox', '(512) 555-0304', { plusOnes: 1, tags: ['sales'], ...sent('stopped') }),
  g('acme-g12', 'acme', 'Omar Haddad', 'ohaddad@acmerobotics.com', { plusOnes: 1, tags: ['engineering'], ...yes(1, { Fish: 1 }), allergies: 'Gluten-free' }),
  g('acme-g13', 'acme', 'Beth Carter', 'bcarter@acmerobotics.com', { plusOnes: 1, tags: ['HR'], ...sent('opened') }),
  g('acme-g14', 'acme', 'Luis Romero', '(512) 555-0305', { plusOnes: 1, tags: ['operations'], ...yes(2, { Chicken: 2 }) }),
  g('acme-g15', 'acme', 'Hannah Kim', 'hkim@acmerobotics.com', { plusOnes: 1, tags: ['design'], ...sent() }),
  g('acme-g16', 'acme', 'Grace Okoro', 'gokoro@acmerobotics.com', { plusOnes: 1, tags: ['finance'], ...sent() }),
  // Thompson: family and friends
  g('th-g1', 'thompson', 'Denise Thompson', 'denise.t@gmail.com', { plusOnes: 3, tags: ['family'], ...yes(4, {}, '2026-10-30T12:00:00') }),
  g('th-g2', 'thompson', 'Robert & Mae Thompson', '(512) 555-0401', { plusOnes: 1, tags: ['family'], ...yes(2, {}, '2026-10-31T09:00:00') }),
  g('th-g3', 'thompson', 'Pastor Lewis', 'lewis@stmarks.org', { tags: ['church'], ...yes(1, {}, '2026-10-30T15:00:00'), gift: 'Donation to the food pantry in Harold\'s name' }),
  g('th-g4', 'thompson', 'The Garcia family', '(512) 555-0402', { plusOnes: 3, tags: ['neighbors'], ...yes(3, {}, '2026-11-01T11:00:00'), allergies: 'Tree nuts' }),
  g('th-g5', 'thompson', 'Walt Henderson', '(512) 555-0403', { plusOnes: 1, tags: ['friends'], ...sent('opened') }),
  g('th-g6', 'thompson', 'Lorraine Ellis', 'lellis@gmail.com', { tags: ['friends'], rsvp: 'declined', respondedAt: '2026-11-02T10:00:00', invite: 'opened', invitedAt: '2026-10-30T10:00:00', notes: 'Sending flowers', gift: 'Flowers (white lilies)' }),
  g('th-g7', 'thompson', 'Veterans Post 76', 'post76@vfw.org', { plusOnes: 5, tags: ['community'], ...sent(), gift: 'Flag and honor guard' }),
  g('th-g8', 'thompson', 'Carla & Jim Ruiz', '(512) 555-0404', { plusOnes: 1, tags: ['friends'], ...yes(2, {}, '2026-11-04T18:00:00') }),
]

// ---- Files and mood board (PL-4.5): shared = the client sees it ----
export const files = [
  { id: 'f1', eventId: 'acme', name: 'Ballroom floor plan.pdf', kind: 'file', shared: true, board: false, addedAt: '2026-10-02T10:00:00', addedBy: 'LaToya', comments: [] },
  { id: 'f2', eventId: 'acme', name: 'Vendor costs.xlsx', kind: 'file', shared: false, board: false, addedAt: '2026-10-05T10:00:00', addedBy: 'LaToya', comments: [] },
  { id: 'f3', eventId: 'acme', name: 'Gold and black', kind: 'color', colors: ['#1B1B1F', '#C9A227', '#F4EBD0', '#7A1F2B'], shared: true, board: true, addedAt: '2026-10-10T10:00:00', addedBy: 'LaToya', comments: [{ by: 'Priya', at: '2026-10-11T09:00:00', text: 'Love this. Can the burgundy be a little brighter?' }] },
  { id: 'f4', eventId: 'acme', name: 'Gatsby-style photo booth backdrop', kind: 'link', url: 'https://www.pinterest.com/', shared: true, board: true, addedAt: '2026-10-10T10:05:00', addedBy: 'Priya', comments: [] },
  { id: 'f5', eventId: 'acme', name: 'Theme notes', kind: 'note', text: 'Roaring 20s, but modern: gold accents, black linens, warm lighting. Karaoke stage by the bar.', shared: true, board: true, addedAt: '2026-10-10T10:10:00', addedBy: 'LaToya', comments: [] },
  { id: 'f6', eventId: 'thompson', name: 'Order of service draft.docx', kind: 'file', shared: true, board: false, addedAt: '2026-10-28T10:00:00', addedBy: 'LaToya', comments: [] },
  { id: 'f8', eventId: 'okafor', name: 'DJ booth on the patio.jpg', kind: 'file', shared: false, board: false, addedAt: '2026-10-18T10:00:00', addedBy: 'LaToya', comments: [] },
  { id: 'f9', eventId: 'okafor', name: 'Dance floor at 10 PM.jpg', kind: 'file', shared: false, board: false, addedAt: '2026-10-18T10:01:00', addedBy: 'LaToya', comments: [] },
  { id: 'f7', eventId: 'thompson', name: 'Soft blues and white', kind: 'color', colors: ['#2F4858', '#86A8C0', '#F2F5F7', '#D9C8A9'], shared: true, board: true, addedAt: '2026-10-28T10:05:00', addedBy: 'LaToya', comments: [] },
]

// ---- Approvals (Portal › Approvals): what the planner asked the client to OK ----
export const approvals = [
  { id: 'ap1', eventId: 'acme', kind: 'invitation', title: 'Invitation wording', detail: 'You\'re invited to the Acme Robotics holiday party! Saturday, December 12, 7 PM…', requestedAt: '2026-10-27T10:00:00', status: 'approved', decidedBy: 'Priya Shah', decidedAt: '2026-10-28T14:00:00' },
  { id: 'ap2', eventId: 'acme', kind: 'menu', title: 'Dinner menu v2', detail: 'Herb chicken, seared salmon or wild-mushroom risotto; winter salad; chocolate torte.', requestedAt: '2026-11-03T16:00:00', status: 'pending' },
  { id: 'ap3', eventId: 'thompson', kind: 'invitation', title: 'Announcement wording', detail: 'With love, the Thompson family invites you…', requestedAt: '2026-10-29T10:00:00', status: 'approved', decidedBy: 'Denise Thompson', decidedAt: '2026-10-29T16:00:00' },
]

// ---- Questionnaires (PL-4.4): sent from a task; answers fill event fields ----
export const QUESTIONNAIRE_TEMPLATES = {
  wedding: { title: 'Wedding details', questions: [
    { id: 'ceremony_time', label: 'What time is the ceremony?', type: 'time', field: 'startTime' },
    { id: 'colors', label: 'Your colors or theme, in a few words', type: 'text' },
    { id: 'must_play', label: 'Songs we must play', type: 'textarea' },
    { id: 'do_not_play', label: 'Songs we must NOT play', type: 'textarea' },
    { id: 'vips', label: 'Special people to recognize (grandparents, wedding party)', type: 'textarea' },
    { id: 'guest_estimate', label: 'Your best guess at the guest count today', type: 'number', field: 'guestCount' },
  ] },
  default: { title: 'Event details', questions: [
    { id: 'start_time', label: 'What time should things start?', type: 'time', field: 'startTime' },
    { id: 'theme', label: 'Theme or colors', type: 'text' },
    { id: 'music', label: 'Music you love (and anything to avoid)', type: 'textarea' },
    { id: 'notes', label: 'Anything else we should know?', type: 'textarea' },
    { id: 'guest_estimate', label: 'Your best guess at the guest count today', type: 'number', field: 'guestCount' },
  ] },
}

export const questionnaires = [
  { id: 'q-acme', eventId: 'acme', title: 'Event details', sentAt: '2026-09-20T10:00:00', dueDate: '2026-10-05', answeredAt: '2026-10-02T15:00:00',
    questions: QUESTIONNAIRE_TEMPLATES.default.questions,
    answers: { start_time: '19:00', theme: 'Roaring 20s, gold and black', music: 'Motown and 2000s pop. No country, please.', notes: 'The CEO gives a 5-minute toast at 8:30.', guest_estimate: '150' } },
  { id: 'q-garza', eventId: 'garza', title: 'Wedding details', sentAt: null, dueDate: '2026-11-30', answeredAt: null,
    questions: QUESTIONNAIRE_TEMPLATES.wedding.questions, answers: {} },
]

// ---- Message threads (PL-4.6): one with the client, one per vendor ----
export const threads = [
  // Ana can message before booking (CL-4.5): the thread is keyed by the lead id, which becomes the event id
  { id: 'th-rivera-client', eventId: 'rivera', kind: 'client', name: 'Ana Rivera (client)', shared: true, messages: [
    { id: 'msg-r1', from: 'client', author: 'Ana', at: '2026-11-03T20:16:00', text: 'Hi LaToya! Just sent a change request: could the photo magnets be optional? Everything else looks perfect.' },
    { id: 'msg-r2', from: 'planner', author: 'LaToya', at: '2026-11-04T11:03:00', text: 'Done! v2 is in your inbox. Photo magnets and the extra karaoke hour are now optional, so you can tick them if you want.' },
  ] },
  { id: 'th-acme-client', eventId: 'acme', kind: 'client', name: 'Priya Shah (client)', shared: true, messages: [
    { id: 'msg1', from: 'client', author: 'Priya', at: '2026-11-02T09:15:00', text: 'Hi LaToya! Can we add a few more vegetarian options to the menu?' },
    { id: 'msg2', from: 'planner', author: 'LaToya', at: '2026-11-02T10:02:00', text: 'Absolutely. I asked the caterer for a mushroom risotto. Menu v2 is in your Approvals.' },
    { id: 'msg3', from: 'client', author: 'Priya', at: '2026-11-04T17:40:00', text: 'Perfect, I\'ll look tonight.' },
  ] },
  { id: 'th-acme-catering', eventId: 'acme', kind: 'vendor', eventVendorId: 'acme-hcc', name: 'Hill Country Catering', shared: false, messages: [
    { id: 'msg4', from: 'planner', author: 'LaToya', at: '2026-11-02T10:05:00', text: 'Can you add a mushroom risotto as the vegetarian main? Final count by Dec 5.' },
    { id: 'msg5', from: 'vendor', author: 'Hill Country Catering', at: '2026-11-02T13:30:00', text: 'Yes, same price as the salmon. Updated menu attached.', attachment: 'Menu v2.pdf' },
  ] },
  { id: 'th-acme-dj', eventId: 'acme', kind: 'vendor', eventVendorId: 'acme-rhythm', name: 'DJ Rhythm (karaoke)', shared: false, messages: [
    { id: 'msg6', from: 'planner', author: 'LaToya', at: '2026-11-03T11:00:00', text: 'Confirming 9:30–11:30 PM for karaoke. Song list coming from the guests\' RSVPs.',
      delivery: { failed: [{ name: 'DJ Rhythm', channel: 'SMS', reason: 'replied STOP' }] } },
  ] },
  { id: 'th-thompson-client', eventId: 'thompson', kind: 'client', name: 'Denise Thompson (client)', shared: true, messages: [
    { id: 'msg7', from: 'client', author: 'Denise', at: '2026-11-03T08:00:00', text: 'Thank you for everything. Could the slideshow include the photos my brother sent?' },
    { id: 'msg8', from: 'planner', author: 'LaToya', at: '2026-11-03T08:45:00', text: 'Of course. Devon is adding them today. Take care of yourself this week.' },
  ] },
]

// Extra appointments for the Calendar: a tight squeeze on Sat Nov 14 (travel-time warning)
export const moreAppointments = [
  { id: 'a6', at: '2026-11-14T14:15:00', minutes: 60, title: 'Site visit', with: 'Garza wedding', to: '/app/events/garza', place: 'Laguna Gloria' },
]
