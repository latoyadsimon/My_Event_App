// =====================================================================
// Event Hub (Phase 4): tasks, questionnaires, guests, website, invitations,
// files, approvals, messages, reschedule and cancel.
// Client-side actions on the same data (answering, approving, RSVPs) are
// here too, because they change the same rows the planner sees.
// =====================================================================
import { QUESTIONNAIRE_TEMPLATES } from '../../data/seedPlanning'
import { formatDay, formatWeekdayDay, nowStamp, parseDay, daysUntil } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { cancellationQuote, getEventGuests, toDay } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'
import { notifyVendors } from './logistics'

const shiftDay = (day, n) => { const d = parseDay(day); d.setDate(d.getDate() + n); return toDay(d) }
const eventOf = (state, id) => state.events.find((e) => e.id === id)
const clientOfEvent = (state, event) => state.clients.find((c) => c.id === event.clientId)
const withLog = (state, eventId, text) => ({
  ...state, events: updateById(state.events, eventId, (e) => ({ log: [...(e.log ?? []), { at: nowStamp(), text }] })),
})
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: `${firstName(state.team.find((m) => m.role === 'owner')?.name)} (planner)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'planner' },
})
const emailClient = (state, event, subject, body, link) => {
  const client = clientOfEvent(state, event)
  return withMessage(state, { type: 'email', to: client.email, from: state.business.name, subject, body, link: link && { ...link, role: 'client', clientId: client.id } })
}
const addApproval = (state, approval) => ({
  ...state, approvals: [...state.approvals, { id: newId('ap'), requestedAt: nowStamp(), status: 'pending', ...approval }],
})

/** Who gets an invitation, and by which channel (SMS if there's a phone, else email). */
function audienceOf(state, eventId, audience, ids) {
  const list = getEventGuests(state, eventId)
  if (ids?.length) return list.filter((g) => ids.includes(g.id))
  if (audience === 'all') return list.filter((g) => g.invite !== 'stopped')
  if (audience === 'no_reply') return list.filter((g) => !g.rsvp && !['bounced', 'stopped'].includes(g.invite))
  return list.filter((g) => g.invite === 'not_sent')
}

export const hubActions = {
  'event/update': (state, a) => ({ ...state, events: updateById(state.events, a.eventId, a.changes) }),

  // ---- Tasks (PL-4.3) ----
  'task/add': (state, a) => ({
    ...state,
    tasks: [...state.tasks, { id: newId('task'), eventId: a.eventId, title: a.title.trim(), due: a.due, assignee: a.assignee ?? 'latoya', done: false, subtasks: [] }],
  }),
  'task/toggle': (state, a) => ({ ...state, tasks: updateById(state.tasks, a.taskId, (t) => ({ done: !t.done, doneAt: t.done ? null : nowStamp() })) }),
  'task/update': (state, a) => ({ ...state, tasks: updateById(state.tasks, a.taskId, a.changes) }),
  'task/remove': (state, a) => ({ ...state, tasks: updateById(state.tasks, a.taskId, { removed: true }) }),
  'task/restore': (state, a) => ({ ...state, tasks: updateById(state.tasks, a.taskId, { removed: false }) }),
  'task/addSubtask': (state, a) => ({
    ...state, tasks: updateById(state.tasks, a.taskId, (t) => ({ subtasks: [...(t.subtasks ?? []), { id: newId('sub'), title: a.title.trim(), done: false }] })),
  }),
  'task/toggleSubtask': (state, a) => ({
    ...state, tasks: updateById(state.tasks, a.taskId, (t) => ({ subtasks: t.subtasks.map((s) => (s.id === a.subtaskId ? { ...s, done: !s.done } : s)) })),
  }),
  // Reorder: swap with the neighbor in the same event's list
  'task/move': (state, a) => {
    const list = [...state.tasks]
    const i = list.findIndex((t) => t.id === a.taskId)
    const siblings = list.map((t, k) => [t, k]).filter(([t]) => t.eventId === list[i].eventId && !t.removed).map(([, k]) => k)
    const pos = siblings.indexOf(i)
    const j = siblings[pos + a.dir]
    if (j == null) return state
    ;[list[i], list[j]] = [list[j], list[i]]
    return { ...state, tasks: list }
  },

  // ---- Questionnaires (PL-4.4) ----
  'questionnaire/send': (state, a) => {
    const event = eventOf(state, a.eventId)
    let q = state.questionnaires.find((x) => x.eventId === event.id && !x.answeredAt)
    let next = state
    if (!q) {
      const template = QUESTIONNAIRE_TEMPLATES[event.type] ?? QUESTIONNAIRE_TEMPLATES.default
      q = { id: newId('q'), eventId: event.id, title: template.title, sentAt: null, dueDate: shiftDay(nowStamp().slice(0, 10), 14), answeredAt: null, questions: template.questions, answers: {} }
      next = { ...next, questionnaires: [...next.questionnaires, q] }
    }
    next = { ...next, questionnaires: updateById(next.questionnaires, q.id, { sentAt: nowStamp() }) }
    if (a.taskId) next = { ...next, tasks: updateById(next.tasks, a.taskId, { questionnaireId: q.id }) }
    next = emailClient(next, event, `${q.title}: a few questions for you`, `It takes about 5 minutes. Your answers go straight into your event plan. Please answer by ${formatWeekdayDay(q.dueDate)}.`, { label: 'Answer the questions', to: `/portal/questionnaire/${q.id}` })
    return withToast(withLog(next, event.id, `“${q.title}” questionnaire sent`), `Questionnaire sent to ${firstName(clientOfEvent(next, event).name)}`)
  },

  // Saves after every field (CL-3.2), quietly
  'questionnaire/save': (state, a) => ({
    ...state, questionnaires: updateById(state.questionnaires, a.questionnaireId, (q) => ({ answers: { ...q.answers, ...a.answers } })),
  }),

  // Client answers: fields fill in, the task is done, Overview shows "received"
  'questionnaire/answer': (state, a) => {
    const q = state.questionnaires.find((x) => x.id === a.questionnaireId)
    if (!q) return state
    const event = eventOf(state, q.eventId)
    const changes = {}
    for (const question of q.questions.filter((x) => x.field && a.answers[x.id])) {
      changes[question.field] = question.type === 'number' ? Number(a.answers[question.id]) || event[question.field] : a.answers[question.id]
    }
    let next = {
      ...state,
      questionnaires: updateById(state.questionnaires, q.id, { answers: a.answers, answeredAt: a.final === false ? null : nowStamp() }),
      events: updateById(state.events, event.id, changes),
    }
    if (a.final === false) return withToast(next, 'Saved. You can finish any time.')
    next = { ...next, tasks: next.tasks.map((t) => (t.eventId === event.id && !t.done && (t.questionnaireId === q.id || /questionnaire/i.test(t.title)) ? { ...t, done: true, doneAt: nowStamp() } : t)) }
    next = pushToPlanner(next, `${q.title} received`, `${clientOfEvent(next, event).name} answered the questionnaire for ${event.name}.`, `/app/events/${event.id}`)
    return withToast(withLog(next, event.id, `“${q.title}” answers received`), 'Thank you! Your planner has your answers.')
  },

  // ---- Guests (PL-5.1) ----
  'guest/add': (state, a) => {
    const id = newId('guest')
    const contact = a.contact?.trim() ?? ''
    const guest = {
      id, eventId: a.eventId, name: a.name.trim(), email: contact.includes('@') ? contact : '', phone: contact.includes('@') ? '' : contact,
      plusOnes: Number(a.plusOnes) || 0, tags: a.tags ?? [], notes: a.notes ?? '', gift: '', allergies: a.allergies ?? '', songRequest: '', answers: {},
      invite: 'not_sent', rsvp: null, attending: 0, meals: {}, respondedAt: null, addedBy: a.addedBy ?? 'planner', token: `${id}-t`,
    }
    const next = { ...state, guests: [...state.guests, guest] }
    return a.quiet ? next : withToast(next, `${guest.name} added`)
  },
  'guest/update': (state, a) => ({ ...state, guests: updateById(state.guests, a.guestId, a.changes) }),
  'guest/remove': (state, a) => ({ ...state, guests: updateById(state.guests, a.guestId, { removed: true }) }),
  'guest/restore': (state, a) => ({ ...state, guests: updateById(state.guests, a.guestId, { removed: false }) }),

  // CSV import: every column kept, allergies never dropped (PL-5.1)
  'guest/import': (state, a) => {
    const added = a.rows.map((r) => ({
      id: newId('guest'), eventId: a.eventId, name: r.name, email: r.email ?? '', phone: r.phone ?? '', plusOnes: Number(r.plusOnes) || 0,
      tags: r.tags ?? [], notes: r.notes ?? '', gift: '', allergies: r.allergies ?? '', songRequest: '', answers: {},
      invite: 'not_sent', rsvp: null, attending: 0, meals: {}, respondedAt: null, addedBy: a.addedBy ?? 'planner',
    })).map((g) => ({ ...g, token: `${g.id}-t` }))
    return withToast({ ...state, guests: [...state.guests, ...added] }, `Imported ${added.length} household${added.length === 1 ? '' : 's'}`)
  },

  'guests/remindNonResponders': (state, a) => {
    const event = eventOf(state, a.eventId)
    const targets = audienceOf(state, a.eventId, 'no_reply').filter((g) => g.invite !== 'not_sent')
    let next = state
    for (const g of targets) {
      next = withMessage(next, {
        type: g.phone ? 'sms' : 'email', to: `${g.name} · ${g.phone || g.email}`, from: state.business.name, subject: 'RSVP reminder',
        body: `Friendly reminder: please RSVP for ${event.name}${event.site?.rsvpCutoff ? ` by ${formatWeekdayDay(event.site.rsvpCutoff)}` : ''}.`,
        link: { label: 'RSVP', to: `/e/${event.id}/rsvp?t=${g.token}`, role: 'guest' },
      })
    }
    return withToast(next, `Reminder sent to ${targets.length} household${targets.length === 1 ? '' : 's'}`)
  },

  // ---- Final headcount (PL-5.4): client approves, then the planner locks ----
  'headcount/requestApproval': (state, a) => {
    const event = eventOf(state, a.eventId)
    const count = getEventGuests(state, event.id).filter((g) => g.rsvp === 'attending').reduce((s, g) => s + g.attending, 0)
    let next = addApproval(state, { eventId: event.id, kind: 'headcount', title: `Final headcount: ${count}`, detail: `${count} guests attending. Once you approve, your planner locks the count and tells the caterer.`, count })
    next = emailClient(next, event, 'Please approve your final headcount', `${count} guests are attending ${event.name}. Approve it so we can tell the caterer.`, { label: 'Review and approve', to: '/portal/approvals' })
    return withToast(next, 'Sent to your client for approval')
  },

  'headcount/lock': (state, a) => {
    const event = eventOf(state, a.eventId)
    const approval = state.approvals.filter((x) => x.eventId === event.id && x.kind === 'headcount' && x.status === 'approved').at(-1)
    if (!approval || event.headcount?.lockedAt) return state
    const count = getEventGuests(state, event.id).filter((g) => g.rsvp === 'attending').reduce((s, g) => s + g.attending, 0)
    const me = state.team.find((m) => m.id === state.ui?.memberId) ?? state.team.find((m) => m.role === 'owner')
    let next = {
      ...state,
      events: updateById(state.events, event.id, (e) => ({
        headcount: { count, approvedBy: approval.decidedBy, approvedAt: approval.decidedAt, lockedAt: nowStamp(), lockedBy: me.name, previous: e.guestCount },
        guestCount: count,
      })),
    }
    // Tell every vendor (their threads) with a change summary
    const summary = `Final headcount for ${event.name}: ${count} (was ${event.guestCount}). RSVPs are closed.`
    next = { ...next, threads: next.threads.map((t) => (t.eventId === event.id && t.kind === 'vendor'
      ? { ...t, messages: [...t.messages, { id: newId('msg'), from: 'planner', author: firstName(me.name), at: nowStamp(), text: summary }] } : t)) }
    next = notifyVendors(next, event.id, summary)
    return withToast(withLog(next, event.id, `Headcount locked at ${count}`), `Headcount locked at ${count}. Vendors notified.`)
  },

  // ---- Website & RSVP settings (PL-5.2) ----
  'site/update': (state, a) => withToast({ ...state, events: updateById(state.events, a.eventId, (e) => ({ site: { ...e.site, ...a.changes } })) }, 'Website saved'),

  // ---- Invitations (PL-5.3) ----
  'invitation/setWording': (state, a) => ({
    ...state, events: updateById(state.events, a.eventId, (e) => ({ invitation: { ...e.invitation, wording: { ...e.invitation.wording, [a.kind]: a.text } } })),
  }),
  'invitation/requestApproval': (state, a) => {
    const event = eventOf(state, a.eventId)
    let next = addApproval(state, { eventId: event.id, kind: 'invitation', title: 'Invitation wording', detail: event.invitation.wording[a.kind] ?? '' })
    next = { ...next, events: updateById(next.events, event.id, (e) => ({ invitation: { ...e.invitation, approval: { status: 'requested', at: nowStamp() } } })) }
    next = emailClient(next, event, 'Please approve your invitation wording', 'Take a look at the wording before it goes to your guests.', { label: 'Review the wording', to: '/portal/approvals' })
    return withToast(next, 'Sent to your client for approval')
  },
  'invitation/send': (state, a) => {
    const event = eventOf(state, a.eventId)
    const targets = audienceOf(state, a.eventId, a.audience, a.guestIds)
    const record = { id: newId('send'), kind: a.kind, at: a.scheduleAt ?? nowStamp(), channels: a.channels, count: targets.length, scheduled: Boolean(a.scheduleAt) }
    let next = { ...state, events: updateById(state.events, event.id, (e) => ({ invitation: { ...e.invitation, sends: [...e.invitation.sends, record] } })) }
    if (a.scheduleAt) return withToast(next, `Scheduled for ${formatDay(a.scheduleAt.slice(0, 10))} · ${targets.length} households`)
    const wording = event.invitation.wording[a.kind] || `You're invited to ${event.name}!`
    for (const g of targets) {
      const bySms = a.channels.includes('sms') && g.phone
      const byEmail = a.channels.includes('email') && g.email
      if (!bySms && !byEmail) continue
      const bounced = byEmail && !bySms && /@(bounce|invalid)\./.test(g.email)
      next = withMessage(next, {
        type: bySms ? 'sms' : 'email', to: `${g.name} · ${bySms ? g.phone : g.email}`, from: state.business.name,
        subject: a.kind === 'invitation' ? `You're invited: ${event.name}` : a.kind.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase()),
        body: wording, link: { label: a.kind === 'invitation' ? 'Open invitation' : 'See the event', to: a.kind === 'invitation' ? `/i/${g.token}` : `/e/${event.id}`, role: 'guest' },
      })
      next = { ...next, guests: updateById(next.guests, g.id, (x) => ({ invite: bounced ? 'bounced' : x.invite === 'opened' ? 'opened' : 'delivered', invitedAt: x.invitedAt ?? nowStamp() })) }
    }
    return withToast(withLog(next, event.id, `${a.kind.replaceAll('_', ' ')} sent to ${targets.length} households`), `Sent to ${targets.length} household${targets.length === 1 ? '' : 's'}`)
  },

  // ---- Files and mood board (PL-4.5) ----
  'file/add': (state, a) => ({
    ...state,
    files: [...state.files, { id: newId('file'), eventId: a.eventId, shared: false, board: false, comments: [], addedAt: nowStamp(), addedBy: a.addedBy ?? 'LaToya', ...a.file }],
  }),
  'file/update': (state, a) => ({ ...state, files: updateById(state.files, a.fileId, a.changes) }),
  'file/remove': (state, a) => ({ ...state, files: updateById(state.files, a.fileId, { removed: true }) }),
  'file/restore': (state, a) => ({ ...state, files: updateById(state.files, a.fileId, { removed: false }) }),
  'file/comment': (state, a) => {
    const file = state.files.find((f) => f.id === a.fileId)
    let next = { ...state, files: updateById(state.files, a.fileId, (f) => ({ comments: [...f.comments, { by: a.by, at: nowStamp(), text: a.text.trim() }] })) }
    if (a.fromClient) next = pushToPlanner(next, `${a.by} commented on the mood board`, `“${a.text.trim()}” on ${file.name}`, `/app/events/${file.eventId}/files`)
    return next
  },
  'file/requestApproval': (state, a) => {
    const file = state.files.find((f) => f.id === a.fileId)
    const event = eventOf(state, file.eventId)
    let next = addApproval(state, { eventId: event.id, kind: 'mood', title: file.name, detail: file.text ?? (file.colors ? `Colors: ${file.colors.join(', ')}` : file.name), refId: file.id })
    next = { ...next, files: updateById(next.files, file.id, { shared: true }) }
    next = emailClient(next, event, `Please approve: ${file.name}`, 'Your planner shared something for your OK.', { label: 'Review it', to: '/portal/approvals' })
    return withToast(next, 'Sent to your client for approval')
  },

  // ---- Approvals: the client decides (Portal › Approvals) ----
  'approval/decide': (state, a) => {
    const ap = state.approvals.find((x) => x.id === a.approvalId)
    if (!ap || ap.status !== 'pending') return state
    let next = { ...state, approvals: updateById(state.approvals, ap.id, { status: a.decision, decidedBy: a.by, decidedAt: nowStamp(), comment: a.comment?.trim() || null }) }
    if (ap.kind === 'invitation') {
      next = { ...next, events: updateById(next.events, ap.eventId, (e) => ({ invitation: { ...e.invitation, approval: { status: a.decision, by: a.by, at: nowStamp(), comment: a.comment } } })) }
    }
    if (ap.kind === 'change_order' && a.decision === 'approved' && ap.amountCents) {
      next = { ...next, invoices: next.invoices.map((i) => (i.eventId === ap.eventId ? {
        ...i, totalCents: i.totalCents + ap.amountCents,
        installments: i.installments.map((p, k, all) => (k === all.length - 1 ? { ...p, amountCents: p.amountCents + ap.amountCents } : p)),
      } : i)) }
    }
    const event = eventOf(next, ap.eventId)
    next = pushToPlanner(next, `${a.by} ${a.decision === 'approved' ? 'approved' : 'asked for changes to'} ${ap.title}`, a.comment || event.name, `/app/events/${event.id}`)
    return withToast(withLog(next, event.id, `${ap.title}: ${a.decision === 'approved' ? 'approved' : 'changes requested'} by ${a.by}`), a.decision === 'approved' ? 'Approved. Thank you!' : 'Sent to your planner')
  },

  // ---- Messages (PL-4.6) ----
  'thread/post': (state, a) => {
    const thread = state.threads.find((t) => t.id === a.threadId)
    if (!thread || !a.text?.trim()) return state
    let next = { ...state, threads: updateById(state.threads, thread.id, (t) => ({ messages: [...t.messages, { id: newId('msg'), from: a.from, author: a.author, at: nowStamp(), text: a.text.trim(), attachment: a.attachment ?? null }] })) }
    const event = eventOf(next, thread.eventId)
    if (a.from === 'vendor') next = pushToPlanner(next, `Message from ${a.author}`, a.text.trim(), `/app/events/${event.id}/messages`)
    if (a.from === 'client') next = pushToPlanner(next, `Message from ${a.author}`, a.text.trim(), `/app/events/${event.id}/messages`)
    if (a.from === 'planner' && thread.kind === 'client') next = emailClient(next, event, `New message from ${state.business.name}`, a.text.trim(), { label: 'Reply', to: '/portal/messages' })
    return next
  },
  // The client writes to their planner (CL-4.5): works before booking too (keyed by the lead id)
  'thread/postClient': (state, a) => {
    if (!a.text?.trim()) return state
    let next = state
    let thread = state.threads.find((t) => t.eventId === a.eventId && t.kind === 'client')
    if (!thread) {
      thread = { id: newId('th'), eventId: a.eventId, kind: 'client', name: `${a.authorFull ?? a.author} (client)`, shared: true, messages: [] }
      next = { ...next, threads: [...next.threads, thread] }
    }
    next = { ...next, threads: updateById(next.threads, thread.id, (t) => ({ messages: [...t.messages, { id: newId('msg'), from: 'client', author: a.author, at: nowStamp(), text: a.text.trim(), attachment: a.attachment ?? null }] })) }
    const to = state.events.some((e) => e.id === a.eventId) ? `/app/events/${a.eventId}/messages` : `/app/leads/${a.eventId}`
    return pushToPlanner(next, `Message from ${a.author}`, a.text.trim(), to)
  },

  'thread/add': (state, a) => ({
    ...state, threads: [...state.threads, { id: newId('th'), eventId: a.eventId, kind: 'vendor', name: a.name.trim(), shared: false, messages: [] }],
  }),
  'thread/share': (state, a) => ({ ...state, threads: updateById(state.threads, a.threadId, { shared: a.shared }) }),

  // A change order from the thread: lands in Portal › Approvals; approving adds it to the invoice
  'changeOrder/send': (state, a) => {
    const thread = state.threads.find((t) => t.id === a.threadId)
    const event = eventOf(state, thread.eventId)
    let next = addApproval(state, { eventId: event.id, kind: 'change_order', title: `Change order: ${a.title.trim()}`, detail: `${a.title.trim()} · ${formatMoney(a.amountCents)} (added to your final payment)`, amountCents: a.amountCents })
    next = { ...next, threads: updateById(next.threads, thread.id, (t) => ({ messages: [...t.messages, { id: newId('msg'), from: 'planner', author: firstName(state.team.find((m) => m.role === 'owner')?.name), at: nowStamp(), text: `I sent a change order for your OK: ${a.title.trim()}, ${formatMoney(a.amountCents)}. It's in your Approvals.` }] })) }
    next = emailClient(next, event, `Change order: ${a.title.trim()}`, `${formatMoney(a.amountCents)}, added to your final payment if you approve.`, { label: 'Review it', to: '/portal/approvals' })
    return withToast(next, 'Change order sent for approval')
  },

  // ---- Client requests (CL-4.4): cancel or postpone, handled by the planner (PL-3.6 / PL-3.7) ----
  'request/submit': (state, a) => {
    const event = eventOf(state, a.eventId)
    const request = { id: newId('req'), eventId: event.id, kind: a.kind, dates: a.dates ?? [], reason: a.reason?.trim() ?? '', at: nowStamp(), by: a.by, status: 'open' }
    let next = { ...state, requests: [...state.requests, request] }
    const what = a.kind === 'cancel' ? 'asked to cancel' : 'asked to postpone'
    next = pushToPlanner(next, `${a.by} ${what}`, `${event.name}${request.reason ? `: “${request.reason}”` : ''}`, `/app/events/${event.id}/${a.kind === 'cancel' ? 'cancel' : 'reschedule'}`)
    return withToast(withLog(next, event.id, `Client ${what}`), `Sent to ${state.business.name}. They'll reply within one business day.`)
  },
  'request/close': (state, a) => ({ ...state, requests: updateById(state.requests, a.requestId, { status: 'closed' }) }),

  // ---- Co-host (CL-3.4): a partner or parent gets the same or limited access ----
  'client/inviteCoHost': (state, a) => {
    const client = state.clients.find((c) => c.id === a.clientId)
    const next = { ...state, clients: updateById(state.clients, client.id, (c) => ({ coHosts: [...(c.coHosts ?? []), { name: a.name.trim(), email: a.email.trim(), access: a.access, invitedAt: nowStamp() }] })) }
    return withToast(withMessage(next, {
      type: 'email', to: a.email.trim(), from: state.business.name, subject: `${firstName(client.name)} invited you to plan together`,
      body: `${client.name} added you as a co-host${a.access === 'limited' ? ' (guests and messages only)' : ''}. No password needed.`,
      link: { label: 'Open the portal', to: '/portal', role: 'client', clientId: client.id },
    }), `Invite sent to ${a.name.trim()}`)
  },

  // Client ticks off their own to-do (Portal › Home)
  'task/clientDone': (state, a) => {
    const task = state.tasks.find((t) => t.id === a.taskId)
    if (!task || task.assignee !== 'client') return state
    const next = { ...state, tasks: updateById(state.tasks, task.id, { done: true, doneAt: nowStamp() }) }
    return pushToPlanner(next, `${a.by} finished a to-do`, task.title, `/app/events/${task.eventId}/tasks`)
  },

  // ---- Reschedule (PL-3.6): every open task and unpaid payment shifts by the same number of days ----
  'event/reschedule': (state, a) => {
    const event = eventOf(state, a.eventId)
    const delta = Math.round((parseDay(a.date) - parseDay(event.date)) / 86400000)
    if (!delta || daysUntil(a.date) <= 0) return state
    const soonest = shiftDay(nowStamp().slice(0, 10), 1)
    const clamp = (day) => [day, soonest].sort().at(-1)
    let next = {
      ...state,
      events: updateById(state.events, event.id, (e) => ({
        date: a.date,
        site: e.site?.rsvpCutoff ? { ...e.site, rsvpCutoff: clamp(shiftDay(e.site.rsvpCutoff, delta)) } : e.site,
      })),
      leads: event.leadId ? updateById(state.leads, event.leadId, { eventDate: a.date }) : state.leads,
      requests: (state.requests ?? []).map((r) => (r.eventId === event.id ? { ...r, status: 'closed' } : r)),
      tasks: state.tasks.map((t) => (t.eventId === event.id && !t.done ? { ...t, due: clamp(shiftDay(t.due, delta)) } : t)),
      invoices: state.invoices.map((i) => (i.eventId === event.id ? {
        ...i, installments: i.installments.map((p) => (p.paidAt || p.voided ? p : { ...p, dueDate: clamp(shiftDay(p.dueDate, delta)) })),
      } : i)),
    }
    next = withLog(next, event.id, `Date changed from ${formatDay(event.date)} to ${formatDay(a.date)}${a.reason ? ` (${a.reason})` : ''}`)
    next = emailClient(next, event, `New date: ${formatDay(a.date)}`, `${event.name} has moved from ${formatDay(event.date)} to ${formatDay(a.date)}. Your to-dos and payment dates moved with it.`, { label: 'See your event', to: '/portal' })
    const staff = [...new Set(state.tasks.filter((t) => t.eventId === event.id).map((t) => t.assignee))]
      .map((id) => state.team.find((m) => m.id === id && m.role !== 'owner' && m.status === 'active')).filter(Boolean)
    for (const m of staff) next = withMessage(next, { type: 'sms', to: `${m.name} · ${m.phone}`, from: state.business.name, subject: 'Date change', body: `Heads up: ${event.name} moved to ${formatDay(a.date)}.` })
    next = notifyVendors(next, event.id, `${event.name} moved from ${formatDay(event.date)} to ${formatDay(a.date)}. Please confirm you're still available.`)
    return withToast(next, `${event.name} moved to ${formatDay(a.date)}`)
  },

  // ---- Cancel (PL-3.7): refund per the policy, release everything, archive ----
  'event/cancel': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || event.status === 'cancelled') return state
    const quote = cancellationQuote(state, event.id)
    let next = {
      ...state,
      events: updateById(state.events, event.id, { status: 'cancelled', cancelledAt: nowStamp(), cancelReason: a.reason ?? null }),
      leads: event.leadId ? updateById(state.leads, event.leadId, { hold: null }) : state.leads,
      requests: (state.requests ?? []).map((r) => (r.eventId === event.id ? { ...r, status: 'closed' } : r)),
      tasks: state.tasks.map((t) => (t.eventId === event.id && !t.done ? { ...t, removed: true } : t)),
      appointments: state.appointments.filter((x) => x.to !== `/app/events/${event.id}`),
      invoices: state.invoices.map((i) => (i.eventId === event.id ? {
        ...i,
        installments: i.installments.map((p) => (p.paidAt ? p : { ...p, voided: true })),
        refunds: quote.refundCents > 0 ? [...i.refunds, { id: newId('refund'), at: nowStamp(), amountCents: quote.refundCents, kind: 'refund', reason: 'Event cancelled' }] : i.refunds,
        options: { ...i.options, remindersPaused: true },
      } : i)),
    }
    next = withLog(next, event.id, `Cancelled${a.reason ? `: ${a.reason}` : ''}. Refund ${formatMoney(quote.refundCents)}.`)
    next = notifyVendors(next, event.id, `${event.name} on ${formatDay(event.date)} is cancelled. We'll be in touch about any deposits.`)
    next = { ...next, reservations: (next.reservations ?? []).filter((r) => r.eventId !== event.id) }   // gear is free again
    next = emailClient(next, event, `${event.name} is cancelled`, `We're sorry to see this one go. ${quote.refundCents ? `A refund of ${formatMoney(quote.refundCents)} is on its way to your original payment method.` : 'Per your contract, no refund is due.'}`)
    return withToast(next, `${event.name} cancelled`)
  },
}
