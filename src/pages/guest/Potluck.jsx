// =====================================================================
// Guest › Bring a dish / Lend a hand (GU-3.1, GU-3.2), /e/:slug/potluck.
// No account: name and (optionally) a phone or email for reminders. A
// guest link (?t=) fills those in. Categories show filled/needed (targets
// scale with headcount); a similar dish in the same category gets a
// gentle warning that suggests under-filled categories, and you can still
// add yours. Words follow EN | ES like every guest page.
// =====================================================================
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { potluckBoard, similarDish, volunteerBoard } from '../../store/selectors'
import { DIET_TAGS } from '../../data/seedLogistics'
import { guestTime } from '../../lib/guestText'
import { Button, Field } from '../../components/ui'
import styles from './guest.module.css'

const withToken = (path, token) => (token ? `${path}?t=${token}` : path)

function DishForm({ event, guest, t, board }) {
  const { state, dispatch } = useStore()
  const open = board.categories.filter((c) => c.short > 0)
  const [v, setV] = useState({ name: guest?.name ?? '', contact: guest?.phone || guest?.email || '', categoryId: (open[0] ?? board.categories[0]).id, dish: '', servings: '12', diet: [], outlet: false, temp: 'room' })
  const [done, setDone] = useState(null)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const similar = v.dish.trim().length > 2 ? similarDish(state, event.id, v.categoryId, v.dish) : null
  const suggest = open.filter((c) => c.id !== v.categoryId).sort((a, b) => b.short - a.short).slice(0, 2).map((c) => c.name).join(', ')
  const submit = (e) => {
    e.preventDefault()
    dispatch({ type: 'potluck/claim', eventId: event.id, guestId: guest?.id, ...v })
    setDone(v.dish.trim())
    setV({ ...v, dish: '', diet: [], outlet: false, temp: 'room' })
  }
  return (
    <form className="stack" onSubmit={submit}>
      {done && <p className={styles.muted} role="status">✓ {done}</p>}
      <div className={styles.formGrid}>
        <Field label={t('yourName')} value={v.name} onChange={set('name')} autoComplete="name" required />
        <Field label={t('phoneOrEmail')} value={v.contact} onChange={set('contact')} />
        <Field label={t('category')} as="select" value={v.categoryId} onChange={set('categoryId')}>
          {board.categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({t('ofTarget', { filled: c.filled, target: c.target })})</option>)}
        </Field>
        <Field label={t('whatDish')} value={v.dish} onChange={set('dish')} required />
        <Field label={t('servings')} type="number" min="1" value={v.servings} onChange={set('servings')} />
        <Field label={t('serveIt')} as="select" value={v.temp} onChange={set('temp')}>
          {['hot', 'cold', 'room'].map((x) => <option key={x} value={x}>{t(x)}</option>)}
        </Field>
      </div>
      {similar && <p className={styles.note} role="status">{t('similar', { dish: similar.dish, suggest: suggest || board.categories[0].name })}</p>}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('itIs')}</legend>
        <div className={styles.tags}>
          {DIET_TAGS.map((d) => (
            <label key={d} className={styles.check}>
              <input type="checkbox" checked={v.diet.includes(d)} onChange={() => setV({ ...v, diet: v.diet.includes(d) ? v.diet.filter((x) => x !== d) : [...v.diet, d] })} /> {t(`diet_${d}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={styles.check}><input type="checkbox" checked={v.outlet} onChange={(e) => setV({ ...v, outlet: e.target.checked })} /> {t('needsOutlet')}</label>
      <Button type="submit" variant="primary" disabled={!v.name.trim() || !v.dish.trim()}>{t('signUp')}</Button>
    </form>
  )
}

function VolunteerForm({ event, guest, t, slots }) {
  const { dispatch } = useStore()
  const free = slots.filter((s) => s.open > 0)
  const [v, setV] = useState({ name: guest?.name ?? '', contact: guest?.phone || guest?.email || '', slotId: free[0]?.id ?? '' })
  if (!free.length) return <p className={styles.muted}>{t('slotFull')}</p>
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'volunteer/signUp', eventId: event.id, ...v }) }}>
      <div className={styles.formGrid}>
        <Field label={t('volunteerFor')} as="select" value={v.slotId} onChange={(e) => setV({ ...v, slotId: e.target.value })}>
          {free.map((s) => <option key={s.id} value={s.id}>{s.name}{s.time ? ` · ${s.time}` : ''} ({(s.open === 1 ? t('spotLeft') : t('spotsLeft', { n: s.open }))})</option>)}
        </Field>
        <Field label={t('yourName')} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
        <Field label={t('phoneOrEmail')} value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} />
      </div>
      <Button type="submit" variant="primary" disabled={!v.name.trim() || !v.slotId}>{t('signUp')}</Button>
    </form>
  )
}

export default function Potluck() {
  const { event, guest, token, t, lang } = useOutletContext()
  const { state } = useStore()
  if (!event.potluck?.enabled && !event.volunteer?.enabled) return <p><Link to={withToken(`/e/${event.id}`, token)}>{t('backToSite')}</Link></p>
  const board = potluckBoard(state, event.id)
  const slots = volunteerBoard(state, event.id).map((s) => ({ ...s, time: s.time ? guestTime(s.time, lang) : '' }))
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{event.potluck?.enabled && event.volunteer?.enabled ? t('signUpLink') : event.potluck?.enabled ? t('bringDish') : t('lendHand')}</h1>
        <p className={styles.welcome}>{event.name}</p>
      </header>

      {event.potluck?.enabled && (
        <section className={styles.panel} aria-labelledby="h-dish">
          <h2 id="h-dish" className={styles.panelTitle}>{t('bringDish')}</h2>
          <p className={styles.muted}>{t('potluckLead')}{event.potluck.dropOff && <> {t('dropOff', { time: guestTime(event.potluck.dropOff, lang) })}.</>}</p>
          <ul role="list" className={styles.meter} aria-label={t('whatsComing')}>
            {board.categories.map((c) => (
              <li key={c.id}>
                <span>{c.name}</span>
                <span className={styles.bar} aria-hidden="true"><span style={{ width: `${Math.min(100, (c.filled / c.target) * 100)}%` }} /></span>
                <span className={styles.muted}>{c.short ? t('ofTarget', { filled: c.filled, target: c.target }) : t('covered')}</span>
              </li>
            ))}
          </ul>
          <DishForm event={event} guest={guest} t={t} board={board} />
          <details>
            <summary className={styles.legend}>{t('whatsComing')} ({board.total})</summary>
            <ul role="list" className={styles.summary}>
              {board.categories.flatMap((c) => c.dishes.map((d) => <li key={d.id}>{d.dish} · {c.name}{d.diet.length ? ` · ${d.diet.map((x) => t(`diet_${x}`)).join(', ')}` : ''}</li>))}
            </ul>
          </details>
        </section>
      )}

      {event.volunteer?.enabled && (
        <section className={styles.panel} aria-labelledby="h-help">
          <h2 id="h-help" className={styles.panelTitle}>{t('lendHand')}</h2>
          <ul role="list" className={styles.meter}>
            {slots.map((s) => (
              <li key={s.id}>
                <span>{s.name}{s.time && ` · ${s.time}`}</span>
                <span className={styles.bar} aria-hidden="true"><span style={{ width: `${Math.min(100, (s.filled / s.needed) * 100)}%` }} /></span>
                <span className={styles.muted}>{s.open ? (s.open === 1 ? t('spotLeft') : t('spotsLeft', { n: s.open })) : t('slotFull')}</span>
              </li>
            ))}
          </ul>
          <VolunteerForm key={slots.map((s) => s.open).join()} event={event} guest={guest} t={t} slots={slots} />
        </section>
      )}
      <p><Link to={withToken(`/e/${event.id}`, token)}>{t('backToSite')}</Link></p>
    </>
  )
}
