// =====================================================================
// Form checks. Each returns { field: 'message' } — an empty object means OK.
// Messages follow the style guide: plain language, say how to fix it.
// =====================================================================

export const isEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isPhone = (v = '') => v.replace(/\D/g, '').length >= 10
const isDomain = (v = '') => /^(?!-)([a-z0-9-]+\.)+[a-z]{2,}$/i.test(v.trim())

/** "$11,000" → 1100000 cents (NaN if it isn't a number) */
export function dollarsToCents(text) {
  const clean = String(text).replace(/[$,\s]/g, '')
  if (!/^\d*\.?\d*$/.test(clean) || clean === '' || clean === '.') return NaN
  return Math.round(parseFloat(clean) * 100)
}

/** 250 → "2.50" (for editing a price in a text field) */
export const centsToDollars = (cents) => (cents / 100).toFixed(2)

export function validateSignUp(v, method = 'email') {
  const errors = {}
  if (!v.ownerName?.trim()) errors.ownerName = 'Please enter your name.'
  if (!v.businessName?.trim()) errors.businessName = 'Please enter your business name. You can change it later.'
  if (!isEmail(v.email)) errors.email = 'Please enter a full email address, like you@yourbusiness.com'
  if (method === 'email' && (v.password ?? '').length < 8) errors.password = 'Please use at least 8 characters.'
  return errors
}

export function validateBusiness(v) {
  const errors = {}
  if (!v.name?.trim()) errors.name = 'Please enter your business name.'
  if (!isEmail(v.email)) errors.email = 'Please enter a full email address, like hello@yourbusiness.com'
  if (v.customDomain?.trim() && !isDomain(v.customDomain)) errors.customDomain = 'Please enter just the web address, like events.yourbusiness.com'
  return errors
}

export function validateItem(v) {
  const errors = {}
  if (!v.name?.trim()) errors.name = 'Please enter a name.'
  const cents = dollarsToCents(v.price)
  if (Number.isNaN(cents) || cents < 0 || String(v.price).includes('-')) errors.price = 'Please enter a price of $0 or more, like 1500.'
  return errors
}

export function validateInvite(v) {
  const errors = {}
  if (!v.name?.trim()) errors.name = 'Please enter their name.'
  if (!isEmail(v.contact) && !isPhone(v.contact)) errors.contact = 'Please enter an email address or a 10-digit phone number.'
  return errors
}
