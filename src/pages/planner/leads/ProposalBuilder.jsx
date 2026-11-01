// =====================================================================
// Proposal Builder (PL-3.1, PL-3.2): pick a package, tick add-ons, set
// quantities, mark upgrades the client can choose (◇), see the total and
// deposit live, preview it as the client, then send.
//
// Every send makes a new version (v1, v2, …); old ones are kept and the
// client always sees the latest. Gear check: quoting more than you own
// (140 chairs, own 120) warns on that line with three ways to fix it.
// =====================================================================
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getLead, getClient, getProposal, getCatalog, leadName } from '../../../store/selectors'
import { priceVersion, gearWarnings, latestSent, draftOf } from '../../../lib/proposal'
import { formatMoney } from '../../../lib/money'
import { formatDay, formatDayShort } from '../../../lib/clock'
import { centsToDollars, dollarsToCents } from '../../../lib/validate'
import ProposalView from '../../../components/proposal/ProposalView'
import { Button, Card, Dialog, Field, Icon, PageHeader } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './leads.module.css'

/** A first draft from the lead: requested services become add-ons; chairs = guest count. */
function draftFromLead(lead, addons) {
  const wanted = lead.services.map((s) => s.toLowerCase())
  const lines = addons
    .filter((a) => !a.archived && wanted.some((w) => a.name.toLowerCase().startsWith(w)))
    .map((a) => ({ addonId: a.id, qty: a.unit === 'chair' ? lead.guestCount ?? 1 : 1 }))
  return { packageId: null, discountCents: 0, lines }
}

const copyVersion = ({ packageId, discountCents, lines }) => ({ packageId, discountCents, lines: lines.map((l) => ({ ...l })) })

function Builder({ lead, proposal }) {
  const { state, dispatch } = useStore()
  const catalog = getCatalog(state)
  const client = getClient(state, lead.clientId)
  const sent = latestSent(proposal)
  const existingDraft = draftOf(proposal)
  const [draft, setDraft] = useState(() => copyVersion(existingDraft ?? sent ?? draftFromLead(lead, state.addons)))
  const [discount, setDiscount] = useState(draft.discountCents ? centsToDollars(draft.discountCents) : '')
  const [previewing, setPreviewing] = useState(false)
  const [overriding, setOverriding] = useState(null)   // { addonId, note }
  const [error, setError] = useState(null)

  const nextN = existingDraft?.n ?? (proposal ? proposal.versions.at(-1).n + 1 : 1)
  const priced = priceVersion(draft, catalog)
  const warnings = gearWarnings(draft, state.addons)
  const request = proposal?.versions.filter((v) => v.changeRequest).at(-1)
  const answeredIn = request && proposal.versions.find((v) => v.n > request.n && v.sentAt)

  const lineOf = (id) => draft.lines.find((l) => l.addonId === id)
  const setLine = (id, change) => setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.addonId === id ? { ...l, ...change } : l)) }))
  const toggleLine = (addon) => setDraft((d) => (lineOf(addon.id)
    ? { ...d, lines: d.lines.filter((l) => l.addonId !== addon.id) }
    : { ...d, lines: [...d.lines, { addonId: addon.id, qty: addon.unit === 'chair' ? lead.guestCount ?? 1 : 1 }] }))
  const setDiscountText = (text) => {
    setDiscount(text)
    const cents = text.trim() ? dollarsToCents(text) : 0
    if (!Number.isNaN(cents)) setDraft((d) => ({ ...d, discountCents: cents }))
  }

  // Archived add-ons stay listed only if this proposal already uses them
  const addonRows = state.addons.filter((a) => !a.archived || lineOf(a.id))

  const send = () => {
    if (!draft.packageId) { setError('Pick a package first.'); document.getElementById('step-package')?.focus(); return }
    setError(null)
    dispatch({ type: 'proposal/send', leadId: lead.id, version: draft })
  }

  return (
    <>
      <Link to={`/app/leads/${lead.id}`} className={styles.crumb}>← {leadName(state, lead)}</Link>
      <PageHeader title={`Proposal · ${client.name.split(' ').at(-1)}`}
        sub={`${lead.title}${lead.eventDate ? ` · ${formatDay(lead.eventDate)}` : ''}${lead.guestCount ? ` · ${lead.guestCount} guests` : ''}`} />

      <div className={styles.versions} aria-label="Versions">
        {proposal?.versions.filter((v) => v.sentAt).map((v) => (
          <span key={v.n} className={styles.version}>v{v.n} · sent {formatDayShort(v.sentAt)}</span>
        ))}
        <span className={`${styles.version} ${styles.versionCurrent}`}>v{nextN} · draft</span>
      </div>
      {sent && <p className="muted">{client.name.split(' ')[0]} sees v{sent.n} until you send v{nextN}.</p>}

      {request && (
        <div className={styles.request}>
          <span className={styles.requestLabel}>Change request{answeredIn ? ` · answered in v${answeredIn.n}` : ''}</span>
          <p><strong>{request.changeRequest.by}, {formatDayShort(request.changeRequest.at)}:</strong> “{request.changeRequest.text}”</p>
        </div>
      )}

      <div className={styles.builder}>
        <div className="stack">
          <Card>
            <h2 id="step-package" tabIndex={-1} className={styles.stepTitle}>1. Pick a package</h2>
            <div className={styles.packages} role="radiogroup" aria-labelledby="step-package">
              {state.packages.filter((p) => !p.archived || p.id === draft.packageId).map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={draft.packageId === p.id} className={styles.pkg}
                  onClick={() => { setDraft((d) => ({ ...d, packageId: p.id })); setError(null) }}>
                  <span className={styles.pkgName}>{p.name}{draft.packageId === p.id && <Icon name="check" size={16} />}</span>
                  <span className={styles.pkgPrice}>{formatMoney(p.priceCents)}</span>
                  <span className={styles.pkgText}>{p.description}</span>
                </button>
              ))}
            </div>
            {error && <p role="alert" className="muted" style={{ color: 'var(--status-danger-ink)' }}>{error}</p>}
          </Card>

          <Card>
            <h2 className={styles.stepTitle}>2. Add-ons</h2>
            <div className={styles.tableWrap}>
              <table className={styles.lines}>
                <thead><tr><th scope="col">Add-on</th><th scope="col">Qty</th><th scope="col">Client can tick</th><th scope="col" className={styles.num}>Price</th></tr></thead>
                <tbody>
                  {addonRows.map((a) => {
                    const line = lineOf(a.id)
                    return (
                      <tr key={a.id} className={line ? undefined : styles.excluded}>
                        <td>
                          <label className={styles.lineName}>
                            <input type="checkbox" checked={Boolean(line)} onChange={() => toggleLine(a)} />
                            <span>{a.name}{line?.optional ? ' ◇' : ''}</span>
                          </label>
                          {line?.partnerRental && <span className="muted"> Partner rental added · <button type="button" className="link-button" onClick={() => setLine(a.id, { partnerRental: false })}>Undo</button></span>}
                          {line?.overrideNote && <span className="muted"> Override: {line.overrideNote} · <button type="button" className="link-button" onClick={() => setLine(a.id, { overrideNote: '' })}>Undo</button></span>}
                        </td>
                        <td>
                          {line
                            ? <input className={styles.qty} type="number" min="1" value={line.qty} aria-label={`${a.name} quantity`}
                                onChange={(e) => setLine(a.id, { qty: Math.max(1, Number(e.target.value) || 1) })} />
                            : <span className="muted">–</span>}
                        </td>
                        <td>
                          {line && (
                            <label className={styles.optional}>
                              <input type="checkbox" checked={Boolean(line.optional)} onChange={(e) => setLine(a.id, { optional: e.target.checked })} />
                              Optional <span className="visually-hidden">for {a.name}</span>
                            </label>
                          )}
                        </td>
                        <td className={styles.num}>{formatMoney(a.priceCents * (line?.qty ?? 1))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted">◇ Optional upgrades show in the client&apos;s portal with a checkbox. Totals leave them out until they&apos;re ticked.</p>

            {warnings.map((w) => (
              <div key={w.addonId} className={styles.gear} role="status">
                <span>⚠ {w.name}: you own {w.owned}, quoted {w.qty}{lead.eventDate ? ` for ${formatDayShort(lead.eventDate)}` : ''}.</span>
                <div className={styles.gearActions}>
                  <Button size="small" onClick={() => setLine(w.addonId, { qty: w.owned })}>Reduce to {w.owned}</Button>
                  <Button size="small" onClick={() => setLine(w.addonId, { partnerRental: true })}>Add partner rental</Button>
                  <Button size="small" onClick={() => setOverriding({ addonId: w.addonId, note: '' })}>Override + note</Button>
                </div>
              </div>
            ))}

            <Field label="Discount ($)" hint="Taken off before tax" inputMode="decimal" value={discount} onChange={(e) => setDiscountText(e.target.value)}
              error={discount.trim() && Number.isNaN(dollarsToCents(discount)) ? 'Please enter an amount, like 500.' : undefined} />
          </Card>
        </div>

        <Card title="Summary" className={styles.summary}>
          <dl className={styles.totals}>
            <div><dt>Package</dt><dd>{formatMoney(priced.packageCents)}</dd></div>
            <div><dt>Add-ons</dt><dd>{formatMoney(priced.addonsCents)}</dd></div>
            <div><dt>Discount</dt><dd>{priced.discountCents ? `−${formatMoney(priced.discountCents)}` : formatMoney(0)}</dd></div>
            <div><dt>Tax {catalog.taxRatePercent}%</dt><dd>{formatMoney(priced.taxCents)}</dd></div>
            <div className={styles.grand}><dt>Total</dt><dd>{formatMoney(priced.totalCents)}</dd></div>
            {priced.schedule.map((s) => <div key={s.label} className="muted"><dt>{s.label}</dt><dd>{formatMoney(s.amountCents)}</dd></div>)}
          </dl>
          <div className={styles.summaryActions}>
            <Button onClick={() => setPreviewing(true)} disabled={!draft.packageId}>Preview as client</Button>
            <Button onClick={() => dispatch({ type: 'proposal/saveDraft', leadId: lead.id, version: draft })}>Save draft</Button>
            <Button variant="primary" onClick={send}>Send v{nextN} to {client.name.split(' ')[0]}</Button>
          </div>
        </Card>
      </div>

      <Dialog open={previewing} title={`What ${client.name.split(' ')[0]} will see`} onClose={() => setPreviewing(false)} wide>
        <ProposalView version={draft} catalog={catalog} title={lead.title} />
      </Dialog>

      <Dialog open={Boolean(overriding)} title="Override the gear check" onClose={() => setOverriding(null)}
        actions={<Button variant="primary" disabled={!overriding?.note.trim()} onClick={() => { setLine(overriding.addonId, { overrideNote: overriding.note.trim() }); setOverriding(null) }}>Save note</Button>}>
        <Field label="Why is this OK?" hint="For example: the venue supplies 20 chairs." value={overriding?.note ?? ''} onChange={(e) => setOverriding((o) => ({ ...o, note: e.target.value }))} />
      </Dialog>
    </>
  )
}

export default function ProposalBuilder() {
  const { leadId } = useParams()
  const { state } = useStore()
  const lead = getLead(state, leadId)
  if (!lead) return <NotFound what="lead" />
  const proposal = getProposal(state, lead.id)
  // A new key after each send starts the next version fresh from the one just sent
  return <Builder key={`${lead.id}-${proposal?.versions.filter((v) => v.sentAt).length ?? 0}`} lead={lead} proposal={proposal} />
}
