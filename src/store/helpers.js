// =====================================================================
// Small helpers every action handler shares. Each returns a NEW object;
// nothing here edits the state it was given.
// =====================================================================
import { nowStamp } from '../lib/clock'

let counter = 0
/** A unique id like "lead-mh3k2-4" (readable prefix + time + counter). */
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

/** Replace one item in a list (matched by id) with a changed copy. */
export const updateById = (list, id, change) =>
  list.map((x) => (x.id === id ? { ...x, ...(typeof change === 'function' ? change(x) : change) } : x))

/** Add a message to the top of the demo Outbox (stands in for email / SMS / push). */
export const withMessage = (state, message) => ({
  ...state,
  outbox: [{ id: newId('m'), at: nowStamp(), unread: true, ...message }, ...state.outbox],
})

/** Several Outbox messages at once, in the order given (first = oldest). */
export const withMessages = (state, messages) => messages.reduce(withMessage, state)

/** Add a line to a lead's activity log (Lead Detail › Activity). */
export const withActivity = (state, leadId, text) => ({
  ...state,
  leads: updateById(state.leads, leadId, (l) => ({ activity: [...l.activity, { at: nowStamp(), text }] })),
})

/** A short confirmation at the bottom of the screen. */
export const withToast = (state, text, tone = 'success') => ({
  ...state,
  toasts: [...state.toasts, { id: newId('t'), text, tone }],
})

export const isEmailContact = (contact) => contact.includes('@')
export const firstName = (name = '') => name.trim().split(/\s+/)[0]
