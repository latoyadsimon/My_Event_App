// =====================================================================
// Proposal math (PL-3.1). One place prices a proposal version, so the
// Proposal Builder, the client's portal and the invoice always agree.
// Mirrors _recalc_proposal() in app_outline/erd/functions.sql.
//
//   subtotal = package + included add-ons − discount
//   tax      = subtotal × tax rate (rounded to the cent)
//   total    = subtotal + tax
// Optional upgrades (◇) only count once the client ticks them.
// =====================================================================
import { splitByPercent } from './money'

/**
 * version: { packageId, discountCents, lines: [{ addonId, qty, optional }] }
 * catalog: { packages, addons, taxRatePercent, paymentSchedule }
 * chosen:  ids of optional add-ons the client ticked
 */
export function priceVersion(version, catalog, chosen = []) {
  const pkg = catalog.packages.find((p) => p.id === version.packageId) ?? null
  const lines = version.lines.map((line) => {
    const addon = catalog.addons.find((a) => a.id === line.addonId)
    const amountCents = (addon?.priceCents ?? 0) * line.qty
    const included = !line.optional || chosen.includes(line.addonId)
    return { ...line, addon, amountCents, included }
  })
  const packageCents = pkg?.priceCents ?? 0
  const addonsCents = lines.filter((l) => l.included).reduce((sum, l) => sum + l.amountCents, 0)
  const discountCents = Math.min(version.discountCents ?? 0, packageCents + addonsCents)
  const subtotalCents = packageCents + addonsCents - discountCents
  const taxCents = Math.round((subtotalCents * catalog.taxRatePercent) / 100)
  const totalCents = subtotalCents + taxCents
  const schedule = catalog.paymentSchedule ?? [{ label: 'Deposit 30%', percent: 30 }, { label: 'Payment 2 · 40%', percent: 40 }, { label: 'Final · 30%', percent: 30 }]
  const amounts = splitByPercent(totalCents, schedule.map((s) => s.percent))
  return {
    pkg, lines, packageCents, addonsCents, discountCents, subtotalCents, taxCents, totalCents,
    depositCents: amounts[0],
    schedule: schedule.map((s, i) => ({ ...s, amountCents: amounts[i] })),
  }
}

/**
 * Lines that quote more gear than the business owns (e.g. 140 chairs, own 120),
 * unless the planner added a partner rental or overrode it with a note.
 */
export function gearWarnings(version, addons) {
  return version.lines.flatMap((line) => {
    const addon = addons.find((a) => a.id === line.addonId)
    if (!addon || addon.owned == null || line.qty <= addon.owned) return []
    if (line.partnerRental || line.overrideNote) return []
    return [{ addonId: addon.id, name: addon.name, qty: line.qty, owned: addon.owned }]
  })
}

/** The newest version the client was sent (they always see the latest). */
export const latestSent = (proposal) => proposal?.versions.filter((v) => v.sentAt).at(-1) ?? null

/** The unsent draft, if the planner is working on one. */
export const draftOf = (proposal) => {
  const last = proposal?.versions.at(-1)
  return last && !last.sentAt ? last : null
}
