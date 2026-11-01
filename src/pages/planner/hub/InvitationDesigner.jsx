// =====================================================================
// Event Hub › Guests › Invitations › Designer (PL-5.5, product Phase 3).
// A template gallery (the event themes, best fits for this event type
// first) plus the planner's own branded templates; then fonts, an accent
// color (adjusted so it stays readable), a photo, the layout, and an
// optional animated envelope and music (guests can always Skip).
// "Print-ready" opens a 5×7 card with a QR code to the online RSVP.
// Wording, approval and sending stay on the Invitations page.
// =====================================================================
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { designOf } from '../../../data/seedPlanning'
import { THEMES, getTheme } from '../../../styles/themes'
import { MUSIC } from '../../../lib/invitationDesign'
import { formatDay } from '../../../lib/clock'
import { isHexColor } from '../../../lib/brand'
import { Button, Card, Field, Icon, QrCode } from '../../../components/ui'
import InvitationCard, { Envelope } from '../../../components/invitation/InvitationCard'
import NotFound from '../../shared/NotFound'
import styles from './hub.module.css'

const FONTS = [...new Set(THEMES.map((t) => t.fonts.display))].sort()

export default function InvitationDesigner() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [preview, setPreview] = useState('card')       // card | envelope
  const [name, setName] = useState('')
  const design = designOf(event)
  const set = (changes) => dispatch({ type: 'invitation/design', eventId: event.id, changes })
  const current = design.themeId ?? event.theme
  const best = THEMES.filter((t) => t.bestFor.includes(event.type))
  const others = THEMES.filter((t) => !t.bestFor.includes(event.type))
  const wording = event.invitation.wording.invitation || `You're invited to ${event.name} on ${formatDay(event.date)} at ${event.venue}.`
  const swatch = (t) => (
    <li key={t.id}>
      <button type="button" className={styles.template} aria-pressed={current === t.id} onClick={() => set({ themeId: t.id })}
        style={{ '--sw-bg': t.colors.surface, '--sw-accent': t.colors.accent, '--sw-text': t.colors.text }}>
        <span className={styles.templateSwatch} aria-hidden="true"><span /></span>
        <span>{t.name}</span>
      </button>
    </li>
  )

  return (
    <div className={styles.designer}>
      <div className="stack">
        <Card title="Templates">
          {state.business.inviteTemplates?.length > 0 && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>My templates</legend>
              <ul role="list" className={styles.templates}>
                {state.business.inviteTemplates.map((tpl) => (
                  <li key={tpl.id}><button type="button" className={styles.template} onClick={() => dispatch({ type: 'invitation/applyTemplate', eventId: event.id, templateId: tpl.id })}
                    style={{ '--sw-bg': getTheme(tpl.design.themeId)?.colors.surface, '--sw-accent': tpl.design.accent ?? getTheme(tpl.design.themeId)?.colors.accent }}>
                    <span className={styles.templateSwatch} aria-hidden="true"><span /></span><span>{tpl.name}</span>
                  </button></li>
                ))}
              </ul>
            </fieldset>
          )}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Best for this event</legend>
            <ul role="list" className={styles.templates}>{best.map(swatch)}</ul>
          </fieldset>
          <details>
            <summary className={styles.legend}>More templates ({others.length})</summary>
            <ul role="list" className={styles.templates}>{others.map(swatch)}</ul>
          </details>
        </Card>

        <Card title="Style">
          <div className={styles.grid2}>
            <Field label="Display font" as="select" value={design.font ?? ''} onChange={(e) => set({ font: e.target.value || null })}>
              <option value="">The template’s font</option>
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </Field>
            <Field label="Layout" as="select" value={design.layout} onChange={(e) => set({ layout: e.target.value })}>
              <option value="classic">Classic (round photo)</option>
              <option value="photo-top">Photo across the top</option>
            </Field>
          </div>
          <div className={styles.inlineForm}>
            <label className={styles.colorField}>
              <span className={styles.legend}>Accent color</span>
              <input type="color" value={design.accent ?? getTheme(current)?.colors.accent ?? '#A3336A'} onChange={(e) => isHexColor(e.target.value) && set({ accent: e.target.value.toUpperCase() })} />
            </label>
            {design.accent && <Button size="small" onClick={() => set({ accent: null })}>Use the template’s color</Button>}
          </div>
          <p className="muted">If a color is hard to read on the card, it’s darkened (or lightened) just enough to pass.</p>
          <div className={styles.inlineForm}>
            <Field label="Photo" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) set({ photo: URL.createObjectURL(f) }) }} />
            {design.photo && <Button size="small" onClick={() => set({ photo: null })}>Remove photo</Button>}
          </div>
        </Card>

        <Card title="Opening">
          <label className={styles.check}><input type="checkbox" checked={design.envelope} onChange={(e) => set({ envelope: e.target.checked })} /> Animated envelope before the invitation (guests can Skip)</label>
          <Field label="Music" as="select" value={design.music ?? ''} onChange={(e) => set({ music: e.target.value || null })} hint="Plays only after a guest taps, with a mute button">
            <option value="">No music</option>
            {MUSIC.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </Field>
        </Card>

        <Card title="Save and print">
          <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'invitation/saveTemplate', eventId: event.id, name }); setName('') }}>
            <Field label="Save as my template" value={name} onChange={(e) => setName(e.target.value)} hint="Reuse this look on any event" />
            <Button type="submit" disabled={!name.trim()}>Save template</Button>
          </form>
          <Button to={`/print/events/${event.id}/invitation`}><Icon name="proposal" size={14} /> Print-ready card (5×7, QR to RSVP)</Button>
        </Card>
      </div>

      <div className={styles.designerPreview}>
        <div className={styles.segmented} role="group" aria-label="Preview">
          <button type="button" aria-pressed={preview === 'card'} onClick={() => setPreview('card')}>Invitation</button>
          {design.envelope && <button type="button" aria-pressed={preview === 'envelope'} onClick={() => setPreview('envelope')}>Envelope</button>}
        </div>
        {preview === 'envelope' && design.envelope
          ? <Envelope event={event} design={design} name="Dana Lee" onOpen={() => setPreview('card')} />
          : (
            <InvitationCard event={event} design={design} kicker="You’re invited" title={event.name} label="Invitation preview">
              <p>{wording}</p>
              <p className="muted">{formatDay(event.date)} · {event.venue}</p>
            </InvitationCard>
          )}
        {design.music && <p className="muted">♪ {MUSIC.find(([id]) => id === design.music)[1]} plays after the guest opens it (mute anytime).</p>}
      </div>
    </div>
  )
}

/** /print/events/:eventId/invitation: the 5×7 card with a QR code to the online RSVP. */
export function InvitationPrint() {
  const { eventId } = useParams()
  const { state } = useStore()
  const event = state.events.find((e) => e.id === eventId)
  if (!event) return <NotFound what="event" standalone />
  const design = designOf(event)
  const rsvp = `${window.location.origin}/e/${event.id}/rsvp`
  return (
    <main id="main" tabIndex={-1} className={styles.print}>
      <header className={styles.printHead}>
        <p className="muted">Print-ready invitation · 5×7 in · {event.name}</p>
        <Button onClick={() => window.print()} className={styles.noPrint}>Print</Button>
      </header>
      <div className={styles.printCard}>
        <InvitationCard event={event} design={design} kicker="You’re invited" title={event.name}>
          <p>{event.invitation.wording.invitation || `Please join us on ${formatDay(event.date)} at ${event.venue}.`}</p>
          <p>{formatDay(event.date)} · {event.venue}</p>
          <div className={styles.qrRow}><QrCode value={rsvp} size={96} label={`QR code: RSVP at ${rsvp}`} /><span>Scan to RSVP<br /><span className="muted">{rsvp.replace(/^https?:\/\//, '')}</span></span></div>
        </InvitationCard>
      </div>
    </main>
  )
}
