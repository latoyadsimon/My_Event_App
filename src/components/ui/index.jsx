// =====================================================================
// Small shared building blocks (style guide §6). Import what you need:
//   import { Card, PageHeader, StatusChip, Kpis, Field, EmptyState, Money } from '../components/ui'
// =====================================================================
import { useId } from 'react'
import { EVENT_STATUS_STYLE, MONEY_STATUS_STYLE } from '../../styles/themes'
import { formatMoney } from '../../lib/money'
import Icon from './Icon'
import styles from './ui.module.css'

export { default as Button } from './Button'
export { default as Icon, Crown } from './Icon'
export { default as ConfirmDialog } from './ConfirmDialog'
export { default as Dialog } from './Dialog'

/** The noun title at the top of a screen, with optional subtitle and actions. */
export function PageHeader({ title, sub, actions, children }) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1 className={`display ${styles.pageTitle}`}>{title}</h1>
        {sub && <p className={styles.pageSub}>{sub}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
      {children}
    </header>
  )
}

/** A flat panel with an optional title and one action link. */
export function Card({ title, action, as: Tag = 'section', className = '', children, ...rest }) {
  const headingId = useId()
  return (
    <Tag className={`${styles.card} ${className}`} aria-labelledby={title ? headingId : undefined} {...rest}>
      {(title || action) && (
        <div className={styles.cardHead}>
          {title && <h2 id={headingId} className={styles.cardTitle}>{title}</h2>}
          {action && <div className={styles.cardAction}>{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}

const words = (s) => s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase())

/**
 * A status as a dot plus words. kind = 'event' | 'money' picks the color from themes.js;
 * or pass tone ('success' | 'warning' | 'danger' | 'info' | 'neutral') directly.
 */
export function StatusChip({ status, kind = 'event', label, tone }) {
  const map = kind === 'money' ? MONEY_STATUS_STYLE : EVENT_STATUS_STYLE
  return <span className={`${styles.chip} ${styles[tone ?? map[status] ?? 'neutral']}`}>{label ?? words(status)}</span>
}

/** A row of key numbers. items: [{ label, value, note }] */
export function Kpis({ items, label = 'Key numbers' }) {
  return (
    <dl className={styles.kpis} style={{ '--kpi-count': items.length }} aria-label={label}>
      {items.map((k) => (
        <div key={k.label} className={styles.kpi}>
          <dt className={styles.kpiLabel}>{k.label}</dt>
          <dd className={styles.kpiValue}>{k.value}</dd>
          {k.note && <dd className={styles.kpiNote}>{k.note}</dd>}
        </div>
      ))}
    </dl>
  )
}

/** Dollars from cents, with lined-up digits. */
export function Money({ cents, className = '' }) {
  return <span className={`${styles.money} ${className}`}>{formatMoney(cents)}</span>
}

/**
 * A labelled form control. The label is always visible; errors sit under the field.
 *   <Field label="Email" type="email" value={v} onChange={…} error={err} />
 *   <Field label="Notes" as="textarea" />   <Field label="Type" as="select">…options…</Field>
 */
export function Field({ label, hint, error, as: Tag = 'input', id, children, ...rest }) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>{label}</label>
      {hint && <span id={`${fieldId}-hint`} className={styles.hint}>{hint}</span>}
      <Tag id={fieldId} className={styles.control} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...rest}>
        {children}
      </Tag>
      {error && <span id={`${fieldId}-error`} className={styles.error}>{error}</span>}
    </div>
  )
}

/** What to show when there's nothing yet: a title, one sentence, and the action. */
export function EmptyState({ title, children, action }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}><Icon name="sparkle" size={24} /></span>
      <p className={styles.emptyTitle}>{title}</p>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action}
    </div>
  )
}

/**
 * A notice across the top of a section (style guide: status colors + words).
 *   <Notice tone="warning" action={<Button …>Connect now</Button>}>Payments not connected…</Notice>
 */
export function Notice({ tone = 'info', action, children }) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <p>{children}</p>
      {action && <div className={styles.noticeAction}>{action}</div>}
    </div>
  )
}

/** A 1–5 rating as stars, read out as "4 of 5 stars". */
export function Stars({ n }) {
  return <span className={styles.stars} role="img" aria-label={`${n} of 5 stars`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}
