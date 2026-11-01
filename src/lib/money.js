// =====================================================================
// Money is stored in CENTS (whole numbers), like the database and Stripe.
// Adding 0.1 + 0.2 in JavaScript gives 0.30000000000000004; adding 10 + 20 cents never goes wrong.
// =====================================================================

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

/** 1485000 → "$14,850.00" (style guide: always two decimals) */
export const formatMoney = (cents) => usd.format(cents / 100)

/**
 * Split a total into payments by percentage, e.g. 30 / 40 / 30.
 * Each part is rounded to a whole cent; the last part takes whatever is left,
 * so the parts always add up to the total exactly.
 */
export function splitByPercent(totalCents, percents) {
  const parts = percents.slice(0, -1).map((p) => Math.round((totalCents * p) / 100))
  const used = parts.reduce((a, b) => a + b, 0)
  return [...parts, totalCents - used]
}
