// =====================================================================
// Growing the business (product Phase 4): QuickBooks sync (PL-9.1),
// marketing reminders (PL-9.2), duplicate an event or save/apply event
// templates (PL-9.3), review requests and surveys (PL-8.4, CL-6.4, GU-6.2).
// =====================================================================
import { formatDay, nowStamp, parseDay } from '../../lib/clock'
import { withPlanning } from '../../data/seed'
import { REVIEW_SITES } from '../../data/seedGrow'
import { minutesOf, toDay } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const shiftDay = (day, n) => { const d = parseDay(day); d.setDate(d.getDate() + n); return toDay(d) }
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000)
const slug = (name, date) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${date.slice(0, 4)}`

/** What a template keeps (PL-9.3): tasks as "N days before", the run of show, the extras that were on. */
function templateFrom(state, event, name) {
  return {
    id: newId('etpl'), name: name.trim(), type: event.type, startTime: event.startTime, minutes: event.minutes ?? null, theme: event.theme,
    tasks: state.tasks.filter((t) => t.eventId === event.id && !t.removed).map((t) => ({ title: t.title, daysBefore: daysBetween(t.due, event.date), assignee: t.assignee })),
    timeline: state.timeline.filter((t) => t.eventId === event.id && !t.removed && !t.owner?.startsWith('v:'))
      .map((t) => ({ offset: minutesOf(t.time) - minutesOf(event.startTime ?? '17:00'), minutes: t.minutes, title: t.title, owner: t.owner, location: t.location, notes: t.notes, visibility: t.visibility })),
    features: { booth: event.booth?.enabled ?? false, karaoke: event.karaoke?.enabled ?? false, potluck: event.potluck?.enabled ?? false },
    kits: [...new Set(state.reservations.filter((r) => r.eventId === event.id && r.kitId).map((r) => r.kitId))],
  }
}

/** A new event built from a template, on a new date, for a client. */
function eventFromTemplate(state, tpl, a) {
  const id = slug(a.name, a.date)
  if (state.events.some((e) => e.id === id)) return { state: withToast(state, 'An event with that name and year already exists.', 'warning'), id: null }
  const start = minutesOf(tpl.startTime ?? '17:00')
  const pad = (n) => String(n).padStart(2, '0')
  const at = (m) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 60) + 60) % 60)}`
  const soonest = shiftDay(nowStamp().slice(0, 10), 1)
  const base = withPlanning({ id, leadId: null, clientId: a.clientId, name: a.name.trim(), type: tpl.type, date: a.date, startTime: tpl.startTime, venue: a.venue?.trim() || 'TBD', status: 'booked', guestCount: a.guestCount ?? 0, theme: tpl.theme, portalUnlockedAt: null, ...(tpl.minutes && { minutes: tpl.minutes }) })
  const event = {
    ...base,
    booth: { ...base.booth, enabled: tpl.features.booth }, karaoke: { ...base.karaoke, enabled: tpl.features.karaoke }, potluck: { ...base.potluck, enabled: tpl.features.potluck },
    log: [{ at: nowStamp(), text: `Created from “${tpl.name}”` }],
  }
  const next = {
    ...state,
    events: [...state.events, event],
    tasks: [...state.tasks, ...tpl.tasks.map((t) => ({ id: newId('task'), eventId: id, title: t.title, due: [shiftDay(a.date, -t.daysBefore), soonest].sort().at(-1), assignee: t.assignee, done: false, subtasks: [] }))],
    timeline: [...state.timeline, ...tpl.timeline.map((t) => ({ id: newId('ro'), eventId: id, time: at(start + t.offset), minutes: t.minutes, title: t.title, owner: t.owner, location: t.location, notes: t.notes, visibility: t.visibility, done: false }))],
    reservations: [...state.reservations, ...tpl.kits.flatMap((kitId) => (state.kits.find((k) => k.id === kitId)?.items ?? []).map(([itemId, qty]) => ({ id: newId('r'), eventId: id, itemId, qty, kitId, partner: null })))],
  }
  return { state: next, id }
}

export const growActions = {
  // ---- QuickBooks (PL-9.1): a stand-in connection and sync ----
  'quickbooks/connect': (state) => withToast({ ...state, business: { ...state.business, quickbooks: { connectedAt: nowStamp(), lastSyncAt: null } } }, 'QuickBooks connected'),
  'quickbooks/sync': (state) => {
    const invoices = state.invoices.length
    const payments = state.invoices.reduce((t, i) => t + i.installments.filter((p) => p.paidAt).length, 0)
    return withToast({ ...state, business: { ...state.business, quickbooks: { ...state.business.quickbooks, lastSyncAt: nowStamp(), invoices, payments } } }, `Synced ${invoices} invoices and ${payments} payments`)
  },

  // ---- Marketing reminders (PL-9.2): opt-in only ----
  'marketing/setOptIn': (state, a) => ({ ...state, clients: updateById(state.clients, a.clientId, (c) => ({ marketing: { ...c.marketing, optIn: a.on } })) }),
  'marketing/addDate': (state, a) => {
    if (!a.label?.trim() || !a.date) return state
    return { ...state, clients: updateById(state.clients, a.clientId, (c) => ({ marketing: { ...c.marketing, dates: [...c.marketing.dates, { id: newId('kd'), label: a.label.trim(), date: a.date, yearly: Boolean(a.yearly) }] } })) }
  },
  'marketing/send': (state, a) => {
    const client = state.clients.find((c) => c.id === a.clientId)
    const date = client?.marketing.dates.find((d) => d.id === a.dateId)
    if (!client?.marketing.optIn || !date) return state
    const months = Math.round(a.daysAway / 30)
    const when = a.daysAway < 56 ? `${Math.max(1, Math.round(a.daysAway / 7))} weeks` : `${months} months`
    let next = withMessage(state, {
      type: 'email', to: client.email, from: state.business.name, subject: `${date.label} is coming up!`,
      body: `Hi ${firstName(client.name)}! ${date.label} is in ${when} (${formatDay(a.next)}). We'd love to help you celebrate again; dates fill up fast.`,
      link: { label: 'Tell us about it', to: `/b/${state.business.slug}/inquire`, role: 'client' }, foot: 'You get these because you asked us to remember. Unsubscribe anytime.',
    })
    next = { ...next, clients: updateById(next.clients, client.id, (c) => ({ marketing: { ...c.marketing, sent: [...c.marketing.sent, { dateId: date.id, for: a.next, at: nowStamp() }] } })) }
    return withToast(next, `Reminder sent to ${client.name}`)
  },

  // ---- Duplicate / templates (PL-9.3) ----
  'event/duplicate': (state, a) => {
    const src = eventOf(state, a.eventId)
    if (!src || !a.name?.trim() || !a.date) return state
    const made = eventFromTemplate(state, templateFrom(state, src, `${src.name} (copy)`), { ...a, venue: a.venue ?? src.venue, guestCount: src.guestCount })
    return made.id ? withToast(made.state, `${a.name.trim()} created from ${src.name}`) : made.state
  },
  'template/save': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || !a.name?.trim()) return state
    return withToast({ ...state, business: { ...state.business, eventTemplates: [...(state.business.eventTemplates ?? []), templateFrom(state, event, a.name)] } }, `Saved “${a.name.trim()}” as a template`)
  },
  'template/createEvent': (state, a) => {
    const tpl = state.business.eventTemplates.find((t) => t.id === a.templateId)
    if (!tpl || !a.name?.trim() || !a.date || !a.clientId) return state
    const made = eventFromTemplate(state, tpl, a)
    return made.id ? withToast(made.state, `${a.name.trim()} created from “${tpl.name}”`) : made.state
  },

  // ---- Reviews and surveys (PL-8.4 P4, CL-6.4, GU-6.2) ----
  'review/request': (state, a) => {
    const event = eventOf(state, a.eventId)
    const client = state.clients.find((c) => c.id === event.clientId)
    let next = withMessage(state, {
      type: 'email', to: client.email, from: state.business.name, subject: event.type === 'memorial' ? `Thinking of you, ${firstName(client.name)}` : `How did we do, ${firstName(client.name)}?`,
      body: event.type === 'memorial'   // never ask a grieving family for a public review
        ? `We were honored to help with ${event.name}. If you'd like, tell us privately how we did. There's no need to reply.`
        : `Thank you for trusting us with ${event.name}. If you have a minute, a review helps other families find us: ${REVIEW_SITES.map(([, label]) => label).join(', ')}. Or tell us privately in two questions.`,
      link: { label: 'Leave a review', to: '/portal/review', role: 'client', clientId: client.id },
    })
    next = { ...next, events: updateById(next.events, event.id, { reviewRequestedAt: nowStamp() }) }
    return withToast(next, `Review request sent to ${client.name}`)
  },
  'survey/send': (state, a) => {
    const event = eventOf(state, a.eventId)
    const to = state.guests.filter((g) => g.eventId === event.id && !g.removed && (g.rsvp === 'attending' || g.checkedIn) && (g.phone || g.email) && g.invite !== 'stopped')
    let next = state
    for (const g of to) next = withMessage(next, { type: g.phone ? 'sms' : 'email', to: `${g.name} · ${g.phone || g.email}`, from: state.business.name, subject: 'One quick question', body: `How was ${event.name}? Tap a number from 1 to 5.`, link: { label: 'Answer', to: `/e/${event.id}/feedback?t=${g.token}`, role: 'guest' } })
    next = { ...next, events: updateById(next.events, event.id, { surveySentAt: nowStamp() }) }
    return withToast(next, `Survey sent to ${to.length} guest${to.length === 1 ? '' : 's'}`)
  },
  // One answer per person (the key); the planner sees it on Wrap-up and Reports
  'feedback/submit': (state, a) => {
    if (!(a.score >= 1 && a.score <= 5) || state.feedback.some((f) => f.key === a.key)) return state
    return withToast({ ...state, feedback: [...state.feedback, { id: newId('fb'), eventId: a.eventId, from: a.from, name: a.name ?? 'A guest', score: a.score, comment: a.comment?.trim() ?? '', at: nowStamp(), key: a.key }] }, 'Thank you!')
  },
}
