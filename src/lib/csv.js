// =====================================================================
// Guest list import (PL-5.1). Reads CSV text (Excel "Save as CSV", Google
// Sheets "Download as CSV") into guest rows. Column names are matched
// loosely ("Household", "Name", "Plus ones", "+1", "Dietary"…).
// Allergies are never dropped: every allergy/dietary column is kept.
// =====================================================================

/** Split CSV text into rows of cells, honoring "quoted, cells" and "" escapes. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean))
}

const COLUMNS = {
  name: ['name', 'household', 'guest', 'full name', 'guest name'],
  email: ['email', 'e-mail', 'email address'],
  phone: ['phone', 'mobile', 'cell', 'phone number'],
  plusOnes: ['plus ones', 'plus-ones', 'plusones', '+1', 'plus one', 'guests'],
  tags: ['tags', 'group', 'side', 'tag'],
  allergies: ['allergies', 'allergy', 'dietary', 'dietary needs', 'diet'],
  notes: ['notes', 'note', 'comments'],
}

const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/**
 * CSV text → { rows, problems }
 *   rows:     [{ name, email, phone, plusOnes, tags, allergies, notes }] ready to import
 *   problems: the same shape plus { line, reason } for rows to fix first (no name, bad email)
 */
export function parseGuestsCsv(text) {
  const [header, ...body] = parseCsv(text)
  if (!header) return { rows: [], skipped: 0, error: 'The file is empty.' }
  const index = {}
  header.forEach((h, i) => {
    const key = Object.entries(COLUMNS).find(([, names]) => names.includes(h.toLowerCase()))?.[0]
    if (key && index[key] == null) index[key] = i
    if (key === 'allergies' && index.allergies !== i) (index.extraAllergies ??= []).push(i)
  })
  if (index.name == null) return { rows: [], problems: [], error: 'We couldn’t find a "Name" column. Add one to the first row and try again.' }
  const rows = []
  const problems = []
  body.forEach((r, i) => {
    const get = (key) => (index[key] == null ? '' : r[index[key]] ?? '')
    const allergies = [get('allergies'), ...(index.extraAllergies ?? []).map((k) => r[k])].filter(Boolean).join('; ')
    const row = {
      name: get('name'), email: get('email'), phone: get('phone'),
      plusOnes: Number.parseInt(get('plusOnes'), 10) || 0,
      tags: get('tags').split(/[;|]/).map((t) => t.trim()).filter(Boolean),
      allergies, notes: get('notes'),
    }
    const reason = guestRowProblem(row)
    if (reason) problems.push({ ...row, line: i + 2, reason })
    else rows.push(row)
  })
  return { rows, problems }
}

/** Why a row can't be imported yet, or null if it's fine. */
export function guestRowProblem(row) {
  if (!row.name.trim()) return 'Missing name'
  if (row.email && !looksLikeEmail(row.email)) return 'Email looks wrong'
  return null
}
