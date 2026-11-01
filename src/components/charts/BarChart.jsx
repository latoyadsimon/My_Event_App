// =====================================================================
// Bar charts for Reports (PL-9.1), built to the dataviz rules:
//   • one axis, thin bars with a 4px rounded data end on the baseline,
//     2px surface gaps, a recessive grid
//   • color by job: series colors come from --series-1/--series-2
//     (validated for light and dark surfaces, see charts.module.css);
//     text always wears text tokens, never the series color
//   • a legend whenever there are 2 series, plus direct labels
//   • hover/focus tooltip on every bar (keyboard reachable), and a
//     "Show as table" view so nothing depends on color or hover
//
//   <ColumnChart title="Booked vs collected" rows={[{ label, values: [a, b] }]} series={['Booked', 'Collected']} format={formatMoney} />
//   <BarList title="Lead sources" rows={[{ label, value, note }]} format={(n) => n} />
// =====================================================================
import { useId, useState } from 'react'
import styles from './charts.module.css'

function TableView({ caption, head, rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
      </table>
    </div>
  )
}

function Frame({ title, sub, legend, table, children }) {
  const [asTable, setAsTable] = useState(false)
  const id = useId()
  return (
    <figure className={styles.figure} aria-labelledby={id}>
      <figcaption className={styles.head}>
        <span id={id} className={styles.title}>{title}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
        <button type="button" className="link-button" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>{asTable ? 'Show as chart' : 'Show as table'}</button>
      </figcaption>
      {legend}
      {asTable ? table : children}
    </figure>
  )
}

/** Vertical bars over time, 1–2 series (grouped). */
export function ColumnChart({ title, sub, rows, series, format }) {
  const [tip, setTip] = useState(null)
  const max = Math.max(1, ...rows.flatMap((r) => r.values))
  const ticks = [0, 0.5, 1].map((f) => f * max)
  const legend = series.length > 1 && (
    <ul role="list" className={styles.legend}>
      {series.map((s, i) => <li key={s}><span className={styles.swatch} data-series={i + 1} aria-hidden="true" />{s}</li>)}
    </ul>
  )
  return (
    <Frame title={title} sub={sub} legend={legend}
      table={<TableView caption={title} head={['Month', ...series]} rows={rows.map((r) => [r.label, ...r.values.map(format)])} />}>
      <div className={styles.columns} role="list" aria-label={title} onMouseLeave={() => setTip(null)}>
        <div className={styles.grid} aria-hidden="true">{ticks.slice().reverse().map((t) => <span key={t}>{format(t)}</span>)}</div>
        {rows.map((r, n) => (
          <div key={r.label} className={styles.group} role="listitem" data-odd={n % 2 === 1 || undefined}>
            <div className={styles.bars}>
              {r.values.map((v, i) => (
                <button key={i} type="button" className={styles.bar} data-series={i + 1} style={{ height: `${(v / max) * 100}%` }}
                  aria-label={`${r.label}, ${series[i]}: ${format(v)}`}
                  onMouseEnter={() => setTip({ label: r.label, i, v })} onFocus={() => setTip({ label: r.label, i, v })} onBlur={() => setTip(null)} />
              ))}
            </div>
            <span className={styles.tick}>{r.short ?? r.label}</span>
          </div>
        ))}
        {tip && <div className={styles.tip} role="status"><strong>{tip.label}</strong> · {series[tip.i]}: {format(tip.v)}</div>}
      </div>
    </Frame>
  )
}

/** Horizontal bars, one series, each labeled directly with its value. */
export function BarList({ title, sub, rows, format, max: maxValue }) {
  const max = maxValue ?? Math.max(1, ...rows.map((r) => r.value))
  return (
    <Frame title={title} sub={sub}
      table={<TableView caption={title} head={['', 'Value', '']} rows={rows.map((r) => [r.label, format(r.value), r.note ?? ''])} />}>
      <ul role="list" className={styles.barList} aria-label={title}>
        {rows.map((r) => (
          <li key={r.label} title={`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ''}`}>
            <span className={styles.rowLabel}>{r.label}</span>
            <span className={styles.track}><span className={styles.fill} data-series="1" style={{ width: `${(r.value / max) * 100}%` }} /></span>
            <span className={styles.value}>{format(r.value)}{r.note && <span className={styles.note}> · {r.note}</span>}</span>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
