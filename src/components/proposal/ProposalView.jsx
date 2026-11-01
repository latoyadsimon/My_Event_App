// =====================================================================
// A proposal exactly as the client sees it. Used by the planner's
// "Preview as client" and by Portal › Proposal, so the two never differ.
//
//   <ProposalView version={v} catalog={getCatalog(state)} chosen={ids} onToggle={id => …} />
// Without onToggle the optional upgrades are shown but can't be ticked (preview).
// =====================================================================
import { useId } from 'react'
import { priceVersion } from '../../lib/proposal'
import { formatMoney } from '../../lib/money'
import styles from './ProposalView.module.css'

export default function ProposalView({ version, catalog, chosen = [], onToggle, title }) {
  const p = priceVersion(version, catalog, chosen)
  const optional = p.lines.filter((l) => l.optional)
  const included = p.lines.filter((l) => !l.optional)
  const upgradesId = useId()

  return (
    <div className={styles.view}>
      {title && <div className={styles.banner}><span>{title}</span></div>}

      <div className={styles.parts}>
        <section className={styles.part} aria-label="Package">
          <h3 className={styles.partTitle}>{p.pkg?.name ?? 'No package'} package · {formatMoney(p.packageCents)}</h3>
          {p.pkg?.description && <p className={styles.text}>{p.pkg.description}</p>}
        </section>

        <section className={styles.part} aria-label="Included add-ons">
          <h3 className={styles.partTitle}>Included add-ons</h3>
          {included.length
            ? <ul role="list" className={styles.items}>
                {included.map((l) => (
                  <li key={l.addonId}><span>{l.qty > 1 ? `${l.qty} ` : ''}{l.addon?.name}</span><span className={styles.num}>{formatMoney(l.amountCents)}</span></li>
                ))}
              </ul>
            : <p className={styles.text}>None</p>}
        </section>
      </div>

      {optional.length > 0 && (
        <fieldset className={styles.upgrades} aria-describedby={upgradesId}>
          <legend className={styles.partTitle}>Optional upgrades</legend>
          <p id={upgradesId} className={styles.text}>{onToggle ? 'Tick any you want. Your total updates right away.' : 'The client can tick these in their portal.'}</p>
          {optional.map((l) => (
            <label key={l.addonId} className={styles.upgrade}>
              <input type="checkbox" checked={chosen.includes(l.addonId)} disabled={!onToggle} onChange={() => onToggle?.(l.addonId)} />
              <span>{l.addon?.name}</span>
              <span className={styles.num}>+{formatMoney(l.amountCents)}</span>
            </label>
          ))}
        </fieldset>
      )}

      <dl className={styles.total}>
        {p.discountCents > 0 && <div><dt>Discount</dt><dd>−{formatMoney(p.discountCents)}</dd></div>}
        <div className={styles.grand}><dt>Total</dt><dd>{formatMoney(p.totalCents)} <small>incl. {catalog.taxRatePercent}% tax</small></dd></div>
        {p.schedule.map((s) => (
          <div key={s.label} className={styles.sched}><dt>{s.label}{s.due ? `, ${s.due}` : ''}</dt><dd>{formatMoney(s.amountCents)}</dd></div>
        ))}
      </dl>
    </div>
  )
}
