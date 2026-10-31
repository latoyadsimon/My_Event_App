// =====================================================================
// Selectors: small functions that read answers out of the state, so screens
// don't repeat the same lookups. Pure functions → easy to test.
// =====================================================================

export const getLead = (state, id) => state.leads.find((l) => l.id === id)
export const getEvent = (state, id) => state.events.find((e) => e.id === id)
export const getClient = (state, id) => state.clients.find((c) => c.id === id)
export const getInvoiceForEvent = (state, eventId) => state.invoices.find((i) => i.eventId === eventId)

/**
 * The client portal's world for one client (the demo client is Ana).
 * Before the deposit there's a lead but no unlocked event, so planning pages stay locked.
 */
export function getPortal(state, clientId = 'ana') {
  const client = getClient(state, clientId)
  const lead = state.leads.find((l) => l.clientId === clientId && l.stage !== 'lost')
  const event = lead && state.events.find((e) => e.leadId === lead.id)
  return { client, lead, event, unlocked: Boolean(event?.portalUnlockedAt) }
}
