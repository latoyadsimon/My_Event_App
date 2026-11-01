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
import { createSeedState, createNewBusinessState, PERMISSIONS } from '../data/seed'
import { nowStamp } from '../lib/clock'
import { newId, updateById, withMessage, isEmailContact as isEmail } from './helpers'
import { salesActions } from './actions/sales'
import { bookingActions } from './actions/booking'
import { hubActions } from './actions/hub'
import { guestActions } from './actions/guests'

// Each domain adds its own handlers: { 'lead/create': (state, action) => newState }
const HANDLERS = { ...salesActions, ...bookingActions, ...hubActions, ...guestActions }

export const MODES = ['calm', 'bold']
export const ROLES = ['planner', 'client', 'guest', 'staff']

// Add a new catalog item (package / add-on) or update the one with the same id.
function saveItem(list, item, prefix) {
  if (item.id && list.some((x) => x.id === item.id)) return updateById(list, item.id, item)
  return [...list, { archived: false, ...item, id: newId(prefix) }]
}

export function initialState() {
  return {
    ...createSeedState(),
    ui: { mode: 'calm', role: 'planner', clientId: 'ana', staffId: 'sam' },
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
      // clientId: which client the portal shows (a proposal email for Linh opens Linh's portal)
      return { ...state, ui: { ...state.ui, role: action.role, memberId: action.memberId ?? null, ...(action.clientId && { clientId: action.clientId }) } }

    case 'ui/tourSeen':   // the client portal's first-visit tour (CL-2.5), once per client
      return { ...state, ui: { ...state.ui, toursSeen: [...(state.ui.toursSeen ?? []), action.clientId] } }

    // ---- Demo Outbox: stands in for email / SMS / push until the backend exists ----
    case 'outbox/send':
      return withMessage(state, action.message)

    case 'outbox/read':
      return {
        ...state,
        outbox: state.outbox.map((m) => (m.id === action.id ? { ...m, unread: false } : m)),
      }

    // ---- Sign up (PL-1.1): a brand-new business with me as Owner ----
    case 'account/signUp': {
      const fresh = createNewBusinessState(action)
      return withMessage({ ...state, ...fresh, ui: { ...state.ui, role: 'planner' } }, {
        type: 'email', to: action.email, from: 'Crowned', subject: 'Welcome to Crowned',
        body: `Hi ${action.ownerName.split(' ')[0]}, ${action.businessName} is ready. Finish setting up (about 10 minutes), then share your inquiry form to get your first lead.`,
        link: { label: 'Finish setting up', to: '/app/onboarding/business', role: 'planner' },
      })
    }

    case 'account/secure':   // the owner's passkey or authenticator app (NFR-1)
      return { ...state, team: state.team.map((m) => (m.role === 'owner' ? { ...m, twoFactor: action.method } : m)) }

    // ---- Onboarding + business settings (PL-1.2 to PL-1.7) ----
    case 'onboarding/complete':
      return { ...state, business: { ...state.business, onboarding: { ...state.business.onboarding, [action.step]: true } } }

    case 'business/update':
      return { ...state, business: { ...state.business, ...action.changes } }

    case 'business/inquiryFormShared':
      return { ...state, business: { ...state.business, inquiryFormShared: true } }

    case 'payments/connect':
      return { ...state, business: { ...state.business, paymentProvider: action.provider, onboarding: { ...state.business.onboarding, payments: true } } }

    case 'payments/disconnect':
      return { ...state, business: { ...state.business, paymentProvider: null } }

    case 'calendar/connect':
      return { ...state, business: { ...state.business, calendarProvider: action.provider, onboarding: { ...state.business.onboarding, calendar: true } } }

    case 'calendar/disconnect':
      return { ...state, business: { ...state.business, calendarProvider: null } }

    case 'templates/update': {
      const [group, key] = action.path
      const templates = state.business.templates
      return { ...state, business: { ...state.business, templates: { ...templates, [group]: { ...templates[group], [key]: action.value } } } }
    }

    // ---- Packages and add-ons: archived, never deleted (old proposals point at them) ----
    case 'package/save':
      return { ...state, packages: saveItem(state.packages, action.item, 'pkg') }
    case 'package/archive':
      return { ...state, packages: updateById(state.packages, action.id, { archived: true }) }
    case 'package/restore':
      return { ...state, packages: updateById(state.packages, action.id, { archived: false }) }
    case 'addon/save':
      return { ...state, addons: saveItem(state.addons, action.item, 'addon') }
    case 'addon/archive':
      return { ...state, addons: updateById(state.addons, action.id, { archived: true }) }
    case 'addon/restore':
      return { ...state, addons: updateById(state.addons, action.id, { archived: false }) }

    // ---- Team and permissions (PL-1.6) ----
    case 'team/invite': {
      const inviteToken = newId('inv')
      const coordinator = action.role === 'coordinator'
      const member = {
        id: newId('member'), name: action.name, role: action.role, jobTitle: action.jobTitle, status: 'invited', inviteToken,
        email: isEmail(action.contact) ? action.contact : '', phone: isEmail(action.contact) ? '' : action.contact,
        permissions: { see_budgets: coordinator, see_profit: false, take_payments: false, edit_vendors: coordinator },
      }
      const text = `${state.business.name} invited you to join their team on Crowned as ${action.jobTitle}. Tap to accept:`
      return withMessage({ ...state, team: [...state.team, member] }, isEmail(action.contact)
        ? { type: 'email', to: action.contact, from: state.business.name, subject: `Join ${state.business.name} on Crowned`, body: text, link: { label: 'Accept the invite', to: `/join/${inviteToken}`, role: 'staff' } }
        : { type: 'sms', to: action.contact, from: state.business.name, subject: 'Team invite', body: text, link: { label: 'Accept the invite', to: `/join/${inviteToken}`, role: 'staff' } })
    }

    case 'team/setPermission': {
      const member = state.team.find((m) => m.id === action.memberId)
      const rule = PERMISSIONS.find((p) => p.id === action.permission)
      if (!member || !rule || member.role === 'owner') return state
      if (rule.ownerOnly && action.value) return state      // profit is owner-only (spec)
      return { ...state, team: updateById(state.team, member.id, { permissions: { ...member.permissions, [rule.id]: action.value } }) }
    }

    case 'team/deactivate': {
      const member = state.team.find((m) => m.id === action.memberId)
      if (!member || member.role === 'owner') return state   // a business always keeps its owner
      return { ...state, team: updateById(state.team, member.id, { status: 'deactivated', deactivatedAt: nowStamp() }) }
    }

    case 'team/reactivate':
      return { ...state, team: updateById(state.team, action.memberId, { status: 'active', deactivatedAt: null }) }

    // ---- Toasts: short confirmations ("Proposal sent to Ana") ----
    case 'toast/show':
      return { ...state, toasts: [...state.toasts, { id: newId('t'), text: action.text, tone: action.tone ?? 'success', undo: action.undo ?? null }] }

    case 'toast/dismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    default: {
      const handler = HANDLERS[action.type]
      if (!handler) throw new Error(`Unknown action: ${action.type}`)
      return handler(state, action)
    }
  }
}
