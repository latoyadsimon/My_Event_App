// =====================================================================
// Guest pages (invitation, event website, RSVP, confirmation). No account:
// the guest's link carries a token (/i/<token> or ?t=<token>) that says
// which household they are (GU-1.1).
// The EVENT THEME is the star (style guide layer 3): its colors and display
// font come in as --theme-* variables. Memorials get data-tone="respectful".
// The planner's brand sits in the footer (NFR-15). EN | ES follows the
// browser language, with a toggle (NFR-10).
// Privacy (GU-2.3): a private site shows "Ask the host" without a token;
// a password site asks once; a public site lets anyone RSVP. The karaoke
// request, magnet and gallery pages are never gated by the site (QRs at the
// venue; the gallery has its own private/expiry rules).
// =====================================================================
import { useState } from 'react'
import { Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { getEvent, getLead } from '../store/selectors'
import { defaultSite } from '../data/seedPlanning'
import { DEFAULT_THEME_FOR_EVENT_TYPE, getTheme, isRespectful, themeToCssVars } from '../styles/themes'
import { guestT } from '../lib/guestText'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import { Button, Field } from '../components/ui'
import NotFound from '../pages/shared/NotFound'
import PageFrame from '../components/shell/PageFrame'
import styles from './GuestLayout.module.css'

const browserLang = () => (typeof navigator !== 'undefined' && navigator.language?.startsWith('es') ? 'es' : 'en')

// Rivera isn't an event until Ana books, but the planner can preview its website,
// so guest pages fall back to the lead.
function findGuestEvent(state, slug) {
  const event = getEvent(state, slug)
  if (event) return event
  const lead = getLead(state, slug)
  if (!lead) return null
  const preview = { id: lead.id, name: lead.title.replace(/^./, (c) => c.toUpperCase()), type: lead.eventType, theme: DEFAULT_THEME_FOR_EVENT_TYPE[lead.eventType], date: lead.eventDate, venue: lead.venue, startTime: '17:00', clientId: lead.clientId, venueInfo: { address: '' }, preview: true }
  return { ...preview, site: { ...defaultSite(preview), privacy: 'public' } }
}

export default function GuestLayout() {
  const { slug, token: pathToken } = useParams()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const { state } = useStore()
  const [lang, setLang] = useState(browserLang)
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [wrong, setWrong] = useState(false)

  const token = pathToken ?? params.get('t')
  const guest = token ? state.guests.find((g) => g.token === token && !g.removed) : null
  const event = guest ? getEvent(state, guest.eventId) : slug ? findGuestEvent(state, slug) : null
  if (!event || (pathToken && !guest)) return <NotFound what={pathToken ? 'invitation' : 'event'} standalone />

  const theme = getTheme(event.theme) ?? getTheme(DEFAULT_THEME_FOR_EVENT_TYPE[event.type])
  const quiet = isRespectful(theme, event.type)
  const t = guestT(lang)
  const client = state.clients.find((c) => c.id === event.clientId)
  const hosts = client?.partner ? `${client.name.split(' ')[0]} & ${client.partner.split(' ')[0]}` : client?.company ?? client?.name ?? state.business.name
  const preview = params.get('preview') === '1' || state.ui.role === 'planner'
  const site = event.site
  // Karaoke, magnet, auction and paddle pages open from QR codes at the venue; give and sponsor
  // links are shared with donors; the gallery checks its own access. None use the site's gate.
  const atVenue = /\/(karaoke|magnet|gallery|give|auction|paddle|sponsor)$/.test(pathname)
  const gate = !guest && !preview && !atVenue && (site.privacy === 'private' ? 'private' : site.privacy === 'password' && !unlocked ? 'password' : null)

  return (
    <div className={styles.guest} style={themeToCssVars(theme)} data-tone={quiet ? 'respectful' : undefined} lang={lang}>
      <header className={styles.top}>
        <span className={styles.hosts}>{hosts}</span>
        <div className={styles.lang} role="group" aria-label="Language / Idioma">
          {[['en', 'English', 'EN'], ['es', 'Español', 'ES']].map(([code, name, short]) => (
            <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)} lang={code}>
              <span aria-hidden="true">{short}</span><span className="visually-hidden">{name}</span>
            </button>
          ))}
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {gate === 'private' && (
          <section className={styles.gate}>
            <h1 className={styles.gateTitle}>{event.name}</h1>
            <p>{t('askHost')}</p>
          </section>
        )}
        {gate === 'password' && (
          <form className={styles.gate} onSubmit={(e) => { e.preventDefault(); const ok = password === site.password; setUnlocked(ok); setWrong(!ok) }}>
            <h1 className={styles.gateTitle}>{t('passwordTitle')}</h1>
            <Field label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={wrong ? t('wrongPassword') : undefined} />
            <Button type="submit" variant="primary">{t('enter')}</Button>
          </form>
        )}
        {!gate && <PageFrame><Outlet context={{ event, theme, lang, quiet, guest, token, t, hosts, site }} /></PageFrame>}
      </main>
      <footer className={styles.foot}>
        <span className={styles.plannedBy}>{t('plannedBy')}</span>
        <BusinessMark business={state.business} />
        <PoweredBy />
      </footer>
    </div>
  )
}
