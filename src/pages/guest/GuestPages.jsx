// =====================================================================
// Guest pages, in the event's theme, English or Spanish:
//   Invitation    GU-1.2  /i/:token        branded card → details & RSVP
//   EventWebsite  GU-1.3  /e/:slug         when & where, schedule, travel, FAQ, registry
//   Rsvp          GU-2.1  /e/:slug/rsvp    the household's reply, no account
//   RsvpDone      GU-2.2  /e/:slug/rsvp/done  summary, add to calendar, change
// All words come from lib/guestText.js, so the EN | ES toggle covers everything.
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { checkInCode } from '../../store/selectors'
import { designOf } from '../../data/seedPlanning'
import InvitationCard, { Envelope } from '../../components/invitation/InvitationCard'
import { daysUntil } from '../../lib/clock'
import { guestDate, guestTime } from '../../lib/guestText'
import { downloadIcs } from '../../lib/ics'
import { Button, Dialog, Field, Icon, QrCode } from '../../components/ui'
import styles from './guest.module.css'

const at = (event) => `${event.date}T${event.startTime ?? '17:00'}:00`
const mapUrl = (event) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.venueInfo?.address ?? ''}`)}`
const withToken = (path, token) => (token ? `${path}?t=${token}` : path)

/** Whether RSVPs are still open (cutoff, late RSVPs, locked headcount). */
function rsvpState(event) {
  if (event.headcount?.lockedAt) return 'closed'
  const cutoff = event.site?.rsvpCutoff
  if (cutoff && daysUntil(cutoff) < 0) return event.site.allowLate ? 'late' : 'closed'
  return 'open'
}

function MessageHost({ open, onClose, event, name }) {
  const { dispatch } = useStore()
  const { t } = useOutletContext()
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <Dialog open={open} title={t('messageHost')} onClose={() => { setSent(false); onClose() }}
      actions={!sent && <Button variant="primary" disabled={!text.trim()} onClick={() => { dispatch({ type: 'guest/messageHost', eventId: event.id, name, text }); setSent(true); setText('') }}>{t('send')}</Button>}>
      {sent ? <p>{t('sent')}</p> : <Field label={t('yourMessage')} as="textarea" value={text} onChange={(e) => setText(e.target.value)} />}
    </Dialog>
  )
}

export function Invitation() {
  const { event, guest, token, t, lang, hosts, site } = useOutletContext()
  const { dispatch } = useStore()
  const design = designOf(event)
  const [opened, setOpened] = useState(!design.envelope)
  const [music, setMusic] = useState(false)
  useEffect(() => { dispatch({ type: 'guest/opened', token }) }, [dispatch, token])
  const wording = event.invitation?.wording?.invitation
  // Opening the envelope starts the music (a tap = consent); Skip goes straight to the card, quietly
  const open = () => { setOpened(true); if (design.music) setMusic(true) }

  if (!opened) return <Envelope event={event} design={design} name={guest.name} onOpen={open} onSkip={() => setOpened(true)} openLabel={t('openInvite')} skipLabel={t('skip')} />
  return (
    <>
      {design.music && (
        <p className={styles.music}>
          <button type="button" className="link-button" aria-pressed={music} onClick={() => setMusic(!music)}>{music ? `♪ ${t('musicOn')}` : t('musicOff')}</button>
        </p>
      )}
      <InvitationCard event={event} design={design} kicker={t('youreInvited')} title={event.name} titleAs="h1" label={t('youreInvited')}>
        <p className={styles.dear}>{guest.name}{guest.plusOnes ? ` +${guest.plusOnes}` : ''}</p>
        <p className={styles.hostedBy}>{t('hostedBy', { hosts })}</p>
        {wording && lang === 'en' && <p className={styles.wording}>{wording}</p>}
        <p className={styles.when}>{guestDate(event.date, lang)} · {guestTime(event.startTime ?? '17:00', lang)}</p>
        <p>{event.venue}</p>
        {site.rsvpCutoff && <p className={styles.replyBy}>{t('replyBy', { date: guestDate(site.rsvpCutoff, lang, false) })}</p>}
        <div className={styles.actions}>
          <Button variant="primary" to={withToken(`/e/${event.id}/rsvp`, token)}>{t('rsvp')}</Button>
          <Button to={withToken(`/e/${event.id}`, token)}>{t('viewDetails')}</Button>
        </div>
      </InvitationCard>
    </>
  )
}

export function EventWebsite() {
  const { event, guest, token, t, lang, site, quiet } = useOutletContext()
  const status = rsvpState(event)
  const sections = [['details', t('details')], site.sections.schedule && site.schedule.length && ['schedule', t('schedule')],
    (site.sections.hotel && site.hotel) && ['travel', t('travel')], site.sections.faq && site.faq.length && ['faq', t('faq')], site.fundLink && ['fund', t('fund')]].filter(Boolean)
  const rsvpLink = withToken(`/e/${event.id}/rsvp`, token)

  return (
    <>
      <header className={styles.hero}>
        {guest && <p className={styles.kicker}>{t('hi', { name: guest.name.split(' ')[0] })}</p>}
        <h1 className={styles.siteTitle}>{event.name}</h1>
        {site.welcome && <p className={styles.welcome}>{site.welcome}</p>}
      </header>

      {sections.length > 1 && (
        <nav className={styles.sectionNav} aria-label={t('details')}>
          {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>
      )}

      {(event.potluck?.enabled || event.volunteer?.enabled) && (
        <p><Button to={withToken(`/e/${event.id}/potluck`, token)}>{event.potluck?.enabled && event.volunteer?.enabled ? t('signUpLink') : event.potluck?.enabled ? t('bringDish') : t('lendHand')}</Button></p>
      )}

      <div className={styles.grid}>
        <section id="details" className={styles.panel} aria-labelledby="h-when">
          <h2 id="h-when" className={styles.panelTitle}>{t('whenWhere')}</h2>
          <p className={styles.when}>{guestDate(event.date, lang)}<br />{guestTime(event.startTime ?? '17:00', lang)}</p>
          <p><strong>{event.venue}</strong>{event.venueInfo?.address && <><br />{event.venueInfo.address}</>}</p>
          <div className={styles.actions}>
            <Button onClick={() => downloadIcs({ at: at(event), minutes: event.minutes ?? 240, title: event.name, place: event.venue })}>{t('addToCalendar')}</Button>
            <a className={styles.buttonLink} href={mapUrl(event)} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> {t('directions')}</a>
          </div>
        </section>

        {site.sections.schedule && site.schedule.length > 0 && (
          <section id="schedule" className={styles.panel} aria-labelledby="h-schedule">
            <h2 id="h-schedule" className={styles.panelTitle}>{t('schedule')}</h2>
            <ol className={styles.schedule}>{site.schedule.map((s, i) => <li key={i}><span>{s.time}</span><span>{s.text}</span></li>)}</ol>
          </section>
        )}
        {site.sections.dressCode && site.dressCode && (
          <section className={styles.panel} aria-labelledby="h-dress">
            <h2 id="h-dress" className={styles.panelTitle}>{t('dressCode')}</h2>
            <p>{site.dressCode}</p>
          </section>
        )}
        {site.sections.hotel && site.hotel && (
          <section id="travel" className={styles.panel} aria-labelledby="h-hotel">
            <h2 id="h-hotel" className={styles.panelTitle}>{t('hotel')}</h2>
            <p>{site.hotel}</p>
          </section>
        )}
        {site.sections.faq && site.faq.length > 0 && (
          <section id="faq" className={styles.panel} aria-labelledby="h-faq">
            <h2 id="h-faq" className={styles.panelTitle}>{t('faq')}</h2>
            <dl className={styles.faq}>{site.faq.map((f, i) => <div key={i}><dt>{f.q}</dt><dd>{f.a}</dd></div>)}</dl>
          </section>
        )}
        {site.fundLink && (
          <section id="fund" className={styles.panel} aria-labelledby="h-fund">
            <h2 id="h-fund" className={styles.panelTitle}>{quiet ? (lang === 'es' ? 'Donaciones' : 'In memory') : t('fund')}</h2>
            <p className={styles.muted}>{t('fundText')}</p>
            <a className={styles.fundLink} href={site.fundLink} target="_blank" rel="noreferrer">{t('openFund')} <Icon name="external" size={16} /><span className="visually-hidden"> ({t('fundText')})</span></a>
          </section>
        )}
      </div>

      {status !== 'closed' && (guest || site.privacy === 'public') && (
        <div className={styles.rsvpBar}>
          {site.rsvpCutoff && <span>{t('replyBy', { date: guestDate(site.rsvpCutoff, lang, false) })}</span>}
          <Button variant="primary" to={rsvpLink}>{guest?.rsvp ? t('change') : t('rsvpNow')}</Button>
        </div>
      )}
    </>
  )
}

/** Everyone in the household: the guest, plus up to `plusOnes` more. */
const startMembers = (guest) => guest?.members ?? [{ name: guest?.name ?? '', self: true, attending: null, meal: '' }]

export function Rsvp() {
  const { event, guest, t, lang, site } = useOutletContext()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [members, setMembers] = useState(() => startMembers(guest))
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [allergies, setAllergies] = useState(guest?.allergies ?? '')
  const [song, setSong] = useState(guest?.songRequest ?? '')
  const [answers, setAnswers] = useState(guest?.answers ?? {})
  const [error, setError] = useState(null)
  const [asking, setAsking] = useState(false)
  const status = rsvpState(event)
  const allowed = guest ? guest.plusOnes : site.defaultPlusOnes
  // A public reply creates the guest in the store; go to the confirmation once it exists
  const lastBefore = useRef(state.lastRsvp)
  useEffect(() => {
    if (state.lastRsvp && state.lastRsvp !== lastBefore.current) navigate(`/e/${event.id}/rsvp/done?t=${state.lastRsvp.token}`, { replace: true })
  }, [state.lastRsvp, event.id, navigate])
  const extra = members.length - 1

  if (status === 'closed') {
    return (
      <section className={styles.panel}>
        <h1 className={styles.panelTitle}>{event.name}</h1>
        <p>{t('closed', { date: guestDate(site.rsvpCutoff ?? event.date, lang, false) })}</p>
        <Button onClick={() => setAsking(true)}>{t('messageHost')}</Button>
        <MessageHost open={asking} onClose={() => setAsking(false)} event={event} name={guest?.name} />
      </section>
    )
  }

  const setMember = (i, change) => setMembers((list) => list.map((m, k) => (k === i ? { ...m, ...change } : m)))
  const submit = (e) => {
    e.preventDefault()
    const everyone = guest ? members : [{ ...members[0], name: name.trim() }, ...members.slice(1)]
    if (!guest && (!name.trim() || !contact.trim())) { setError(t('needContact')); return }
    if (everyone.some((m) => m.attending === null)) { setError(t('pickAnswer')); return }
    if (everyone.some((m) => !m.name.trim())) { setError(t('needName')); return }
    setError(null)
    dispatch({ type: 'rsvp/submit', eventId: event.id, guestId: guest?.id, name, contact, members: everyone, allergies, songRequest: song, answers })
  }

  return (
    <form className={styles.rsvp} onSubmit={submit} noValidate>
      <header>
        <h1 className={styles.siteTitle}>{guest ? t('hi', { name: guest.name }) : event.name}</h1>
        {site.rsvpCutoff && <p className={styles.muted}>{t(status === 'late' ? 'lateOk' : 'replyBy', { date: guestDate(site.rsvpCutoff, lang, false) })}</p>}
        {!guest && <p>{t('publicIntro')}</p>}
      </header>

      {!guest && (
        <div className={styles.grid}>
          <Field label={t('yourName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Field label={t('contact')} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
        </div>
      )}

      <fieldset className={styles.panel}>
        <legend className={styles.panelTitle}>{t('whoComing')}</legend>
        {members.map((m, i) => (
          <div key={i} className={styles.member}>
            {i === 0
              ? <p className={styles.memberName}>{guest ? m.name : (name || t('you'))}</p>
              : <Field label={t('plusOne', { n: i })} value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} placeholder={t('guestName')} />}
            <div className={styles.choice} role="radiogroup" aria-label={`${i === 0 ? (guest?.name ?? t('you')) : t('plusOne', { n: i })}`}>
              <button type="button" role="radio" aria-checked={m.attending === true} onClick={() => setMember(i, { attending: true })}>{t('attending')}</button>
              <button type="button" role="radio" aria-checked={m.attending === false} onClick={() => setMember(i, { attending: false, meal: '' })}>{t('notAttending')}</button>
            </div>
            {m.attending && site.meals.length > 0 && (
              <Field label={`${t('meal')} · ${i === 0 ? (guest?.name.split(' ')[0] ?? t('you')) : (m.name || t('plusOne', { n: i }))}`} as="select" value={m.meal} onChange={(e) => setMember(i, { meal: e.target.value })}>
                <option value="">{t('chooseMeal')}</option>
                {site.meals.map((meal) => <option key={meal}>{meal}</option>)}
              </Field>
            )}
            {i > 0 && <button type="button" className="link-button" onClick={() => setMembers((list) => list.filter((_, k) => k !== i))}>✕ {t('plusOne', { n: i })}</button>}
          </div>
        ))}
        {allowed > 0 && (extra < allowed
          ? <Button onClick={() => setMembers((list) => [...list, { name: '', attending: true, meal: '' }])}>{t('addGuest')}</Button>
          : <p className={styles.limit}>{t('limitReached', { n: allowed })} <button type="button" className="link-button" onClick={() => setAsking(true)}>{t('messageHost')}</button></p>)}
      </fieldset>

      {site.askAllergies && <Field label={t('allergies')} value={allergies} onChange={(e) => setAllergies(e.target.value)} />}
      {site.songRequest && <Field label={t('song')} value={song} onChange={(e) => setSong(e.target.value)} />}
      {site.customQuestions.map((q) => (
        <Field key={q} label={q} value={answers[q] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))} />
      ))}

      {error && <p className={styles.error} role="alert">{error}</p>}
      <Button type="submit" variant="primary" block>{t('submit')}</Button>
      <MessageHost open={asking} onClose={() => setAsking(false)} event={event} name={guest?.name ?? name} />
    </form>
  )
}

export function RsvpDone() {
  const { event, guest, token, t, lang, site } = useOutletContext()
  if (!guest?.respondedAt) return <p><Link to={`/e/${event.id}`}>{t('backToSite')}</Link></p>
  const going = guest.rsvp === 'attending'
  const open = rsvpState(event) !== 'closed'
  return (
    <section className={styles.panel} aria-live="polite">
      <span className={styles.doneIcon}><Icon name="check" size={24} /></span>
      <h1 className={styles.siteTitle}>{going ? t('thanksYes') : t('thanksNo')}</h1>
      <h2 className={styles.panelTitle}>{t('yourReply')}</h2>
      <ul className={styles.summary}>
        {(guest.members ?? []).map((m, i) => (
          <li key={i}>{m.name}: {m.attending ? `${t('attending')}${m.meal ? ` · ${m.meal}` : ''}` : t('declined')}</li>
        ))}
        {guest.allergies && <li>{t('allergies')}: {guest.allergies}</li>}
        {guest.songRequest && <li>{t('song')}: {guest.songRequest}</li>}
      </ul>
      {going && (
        <div className={styles.checkIn}>
          <span className={styles.muted}>{t('checkInCode')}</span>
          <QrCode value={checkInCode(guest)} size={128} label={`${t('checkInCode')}: ${checkInCode(guest)}`} />
          <strong className={styles.checkInCode}>{checkInCode(guest)}</strong>
          <span className={styles.muted}>{t('checkInHelp')}</span>
        </div>
      )}
      <div className={styles.actions}>
        {going && <Button variant="primary" onClick={() => downloadIcs({ at: at(event), minutes: event.minutes ?? 240, title: event.name, place: event.venue })}>{t('addToCalendar')}</Button>}
        {site.fundLink && <a className={styles.fundLink} href={site.fundLink} target="_blank" rel="noreferrer">{t('openFund')} <Icon name="external" size={16} /></a>}
        {open && <Button to={withToken(`/e/${event.id}/rsvp`, token)}>{t('change')}</Button>}
        <Button to={withToken(`/e/${event.id}`, token)}>{t('backToSite')}</Button>
      </div>
      <p className={styles.muted}>{guestDate(event.date, lang)} · {event.venue}</p>
    </section>
  )
}
