// =====================================================================
// The invitation designer (PL-5.5, product Phase 3): change the design,
// save it as one of the planner's own templates, or start from one.
// The wording, approval and sending stay in Invitations (PL-5.3).
// =====================================================================
import { designOf } from '../../data/seedPlanning'
import { newId, updateById, withToast } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const setDesign = (state, eventId, design) => ({
  ...state, events: updateById(state.events, eventId, (e) => ({ invitation: { ...e.invitation, design } })),
})

export const designerActions = {
  'invitation/design': (state, a) => setDesign(state, a.eventId, { ...designOf(eventOf(state, a.eventId)), ...a.changes }),

  // "Save as my template": reusable on every event, under the planner's own templates
  'invitation/saveTemplate': (state, a) => {
    if (!a.name?.trim()) return state
    const design = designOf(eventOf(state, a.eventId))
    const templates = [...(state.business.inviteTemplates ?? []), { id: newId('tpl'), name: a.name.trim(), design: { ...design, photo: null } }]
    return withToast({ ...state, business: { ...state.business, inviteTemplates: templates } }, `Saved “${a.name.trim()}” to your templates`)
  },

  'invitation/applyTemplate': (state, a) => {
    const tpl = state.business.inviteTemplates.find((t) => t.id === a.templateId)
    if (!tpl) return state
    const current = designOf(eventOf(state, a.eventId))
    return withToast(setDesign(state, a.eventId, { ...current, ...tpl.design, photo: current.photo }), `Using “${tpl.name}”`)
  },
}
