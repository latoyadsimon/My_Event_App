// =====================================================================
// Every screen in the app, with the phase that builds it and where it leads.
// Until a screen is built, its route shows a <Planned id="…"> page made from
// this entry, so every link in the app already goes somewhere real.
//
// folder = its design folder under app_outline/pages/ (stories + wireframe)
// next   = the click path out of the screen (from the wireframes' "➡ Next")
// =====================================================================

export const SCREENS = {
  // ---------- Planner ----------
  signup: { title: 'Sign up', phase: 1, folder: 'planner/sign-up', next: [{ label: 'Onboarding', to: '/app/onboarding/business' }] },
  onboarding: { title: 'Set up your business', phase: 1, folder: 'planner/onboarding', next: [{ label: 'Dashboard', to: '/app/dashboard' }] },
  dashboard: {
    title: 'Dashboard', phase: 1, folder: 'planner/dashboard',
    next: [{ label: 'Leads', to: '/app/leads' }, { label: 'Countersign Rivera', to: '/app/contracts/rivera' }, { label: 'Events', to: '/app/events' }],
  },
  calendar: { title: 'Calendar', phase: 4, folder: 'planner/calendar', next: [{ label: 'Acme holiday party', to: '/app/events/acme' }, { label: 'Kim lead (hold)', to: '/app/leads/kim' }] },
  leads: { title: 'Leads', phase: 2, folder: 'planner/leads', next: [{ label: 'Rivera lead', to: '/app/leads/rivera' }, { label: 'Nguyen lead', to: '/app/leads/nguyen' }] },
  leadDetail: { title: 'Lead', phase: 2, folder: 'planner/lead-detail', next: [{ label: 'Proposal builder', to: '/app/proposals/rivera' }, { label: 'Back to leads', to: '/app/leads' }] },
  proposalBuilder: { title: 'Proposal', phase: 2, folder: 'planner/proposal-builder', next: [{ label: 'Lead', to: '/app/leads/rivera' }] },
  contract: { title: 'Contract', phase: 3, folder: 'planner/contract', next: [{ label: 'Event Hub', to: '/app/events/acme' }, { label: 'Invoice', to: '/app/invoices/acme' }] },
  invoice: { title: 'Invoice', phase: 3, folder: 'planner/invoice', next: [{ label: 'Event Hub › Money', to: '/app/events/acme/money' }] },
  events: { title: 'Events', phase: 3, folder: 'planner/events-list', next: [{ label: 'Acme holiday party', to: '/app/events/acme' }, { label: 'Celebration of life', to: '/app/events/thompson' }] },
  hubOverview: { title: 'Overview', phase: 4, folder: 'planner/event-hub-overview', next: [{ label: 'Tasks', to: 'tasks' }, { label: 'Guests', to: 'guests' }, { label: 'Money', to: 'money' }] },
  hubTasks: { title: 'Tasks', phase: 4, folder: 'planner/event-hub-tasks', next: [{ label: 'Overview', to: '..' }] },
  hubGuests: { title: 'Guest list', phase: 4, folder: 'planner/event-hub-guests', next: [{ label: 'Invitations', to: 'invitations' }, { label: 'Website & RSVP', to: 'website' }] },
  hubWebsite: { title: 'Website & RSVP', phase: 4, folder: 'planner/event-hub-website-rsvp', next: [{ label: 'Preview the event website', to: '/e/rivera' }] },
  hubInvitations: { title: 'Invitations', phase: 4, folder: 'planner/event-hub-invitations', next: [{ label: 'Outbox', to: '/outbox' }] },
  hubMoney: { title: 'Money', phase: 4, folder: 'planner/event-hub-money', next: [{ label: 'Invoice', to: '/app/invoices/acme' }] },
  hubFiles: { title: 'Files & mood board', phase: 4, folder: 'planner/event-hub-files', next: [{ label: 'Overview', to: '..' }] },
  hubMessages: { title: 'Messages', phase: 4, folder: 'planner/event-hub-messages', next: [{ label: 'Overview', to: '..' }] },
  reschedule: { title: 'Change the date', phase: 4, folder: 'planner/reschedule-event', next: [{ label: 'Back to the event', to: '..' }] },
  cancelEvent: { title: 'Cancel the event', phase: 4, folder: 'planner/cancel-event', next: [{ label: 'Back to the event', to: '..' }] },
  settings: { title: 'Settings', phase: 1, folder: 'planner/settings', next: [{ label: 'Appearance', to: '/app/settings/appearance' }] },

  // ---------- Client ----------
  inquiry: { title: 'Plan your event with us', phase: 2, folder: 'client/inquiry-form', next: [{ label: 'Book a consult', to: '/b/bella-events/book' }] },
  booking: { title: 'Book a consult', phase: 2, folder: 'client/booking-page', next: [{ label: 'Outbox', to: '/outbox' }] },
  portalHome: { title: 'Home', phase: 5, folder: 'client/portal-home', next: [{ label: 'Payments', to: '/portal/payments' }, { label: 'Messages', to: '/portal/messages' }] },
  portalProposal: { title: 'Your proposal', phase: 3, folder: 'client/portal-proposal', next: [{ label: 'Contract', to: '/portal/contract' }] },
  portalContract: { title: 'Contract', phase: 3, folder: 'client/portal-contract', next: [{ label: 'Pay your deposit', to: '/portal/pay' }] },
  portalPay: { title: 'Pay your deposit', phase: 3, folder: 'client/portal-pay', next: [{ label: 'Go to your portal', to: '/portal' }] },
  portalQuestionnaire: { title: 'Questionnaire', phase: 5, folder: 'client/portal-questionnaire', next: [{ label: 'Home', to: '/portal' }] },
  portalMoodBoard: { title: 'Mood board', phase: 5, folder: 'client/portal-mood-board', next: [{ label: 'Home', to: '/portal' }] },
  portalApprovals: { title: 'Approvals', phase: 5, folder: 'client/portal-approvals', next: [{ label: 'Home', to: '/portal' }] },
  portalPayments: { title: 'Payments', phase: 5, folder: 'client/portal-payments', next: [{ label: 'Home', to: '/portal' }] },
  portalChange: { title: 'Cancel or postpone', phase: 5, folder: 'client/cancel-or-postpone', next: [{ label: 'Messages', to: '/portal/messages' }] },
  portalGuests: { title: 'Guests', phase: 5, folder: 'client/portal-guests', next: [{ label: 'Home', to: '/portal' }] },
  portalMessages: { title: 'Messages', phase: 5, folder: 'client/portal-messages', next: [{ label: 'Proposal', to: '/portal/proposal' }] },

  // ---------- Guest ----------
  invitation: { title: 'You\'re invited', phase: 6, folder: 'guest/invitation', next: [{ label: 'Event website', to: '/e/rivera' }, { label: 'RSVP', to: '/e/rivera/rsvp?t=abc123' }] },
  eventWebsite: { title: 'Event website', phase: 6, folder: 'guest/event-website', next: [{ label: 'RSVP', to: '/e/rivera/rsvp?t=abc123' }] },
  rsvp: { title: 'RSVP', phase: 6, folder: 'guest/rsvp', next: [{ label: 'Confirmation', to: '/e/rivera/rsvp/done' }] },
  rsvpDone: { title: 'You\'re all set', phase: 6, folder: 'guest/rsvp-confirmation', next: [{ label: 'Event website', to: '/e/rivera' }] },

  // ---------- Staff ----------
  staffJoin: { title: 'Join the team', phase: 6, folder: 'staff/invite-sign-in', next: [{ label: 'Profile', to: '/app/staff/profile' }] },
  staffProfile: { title: 'Profile', phase: 6, folder: 'staff/profile', next: [] },
}

export const PHASE_NAMES = {
  1: 'Planner setup',
  2: 'Leads and selling',
  3: 'Booking',
  4: 'Event Hub',
  5: 'Client portal',
  6: 'Guests and staff',
}
