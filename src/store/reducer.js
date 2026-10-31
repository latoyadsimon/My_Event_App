// =====================================================================
// The app's state and every way it can change.
//
// reducer(state, action) → new state. It never edits the old state; it returns
// a new object (React re-renders when the object changes). Keeping all changes
// here means:
//   • business rules live in one tested place (later: the same rules as functions.sql)
//   • screens only "dispatch" actions, e.g. dispatch({ type: 'ui/setMode', mode: 'bold' })
//
// Nothing is saved: a refresh calls initialState() again (until Supabase).
// =====================================================================
import { createSeedState } from '../data/seed'
import { nowStamp } from '../lib/clock'

export const MODES = ['calm', 'bold']
export const ROLES = ['planner', 'client', 'guest', 'staff']

let counter = 0
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export function initialState() {
  return {
    ...createSeedState(),
    ui: { mode: 'calm', role: 'planner' },
    toasts: [],
  }
}

export function reducer(state, action) {
  switch (action.type) {
    // ---- App settings ----
    case 'ui/setMode':
      if (!MODES.includes(action.mode)) return state
      return { ...state, ui: { ...state.ui, mode: action.mode } }

    case 'ui/setRole':
      if (!ROLES.includes(action.role)) return state
      return { ...state, ui: { ...state.ui, role: action.role } }

    // ---- Demo Outbox: stands in for email / SMS / push until the backend exists ----
    case 'outbox/send':
      return {
        ...state,
        outbox: [{ id: newId('m'), at: nowStamp(), unread: true, ...action.message }, ...state.outbox],
      }

    case 'outbox/read':
      return {
        ...state,
        outbox: state.outbox.map((m) => (m.id === action.id ? { ...m, unread: false } : m)),
      }

    // ---- Toasts: short confirmations ("Proposal sent to Ana") ----
    case 'toast/show':
      return { ...state, toasts: [...state.toasts, { id: newId('t'), text: action.text, tone: action.tone ?? 'success' }] }

    case 'toast/dismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}
