// =====================================================================
// Guest pages (event website, invitation, RSVP). No account, no app nav.
// The EVENT THEME is the star (style guide layer 3): its colors and display
// font come in as --theme-* variables from themeToCssVars(). Memorials get
// data-tone="respectful". The planner's brand sits in the footer (NFR-15).
// EN | ES toggle: guest pages follow the browser language (NFR-10).
// =====================================================================
import { useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { getEvent, getLead } from '../store/selectors'
import { DEFAULT_THEME_FOR_EVENT_TYPE, getTheme, isRespectful, themeToCssVars } from '../styles/themes'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import NotFound from '../pages/shared/NotFound'
import styles from './GuestLayout.module.css'

const browserLang = () => (typeof navigator !== 'undefined' && navigator.language?.startsWith('es') ? 'es' : 'en')

// Rivera isn't an event until Ana books, but the planner can preview its website; the
// guest pages fall back to the lead so the demo link always works.
function findGuestEvent(state, slug) {
  const event = getEvent(state, slug)
  if (event) return { name: event.name, type: event.type, themeId: event.theme, date: event.date }
  const lead = getLead(state, slug)
  if (lead) return { name: lead.title, type: lead.eventType, themeId: DEFAULT_THEME_FOR_EVENT_TYPE[lead.eventType], date: lead.eventDate }
  return null
}

export default function GuestLayout() {
  const { slug = 'rivera' } = useParams()
  const { state } = useStore()
  const [lang, setLang] = useState(browserLang)
  const event = findGuestEvent(state, slug)
  if (!event) return <NotFound what="event" />

  const theme = getTheme(event.themeId)
  const quiet = isRespectful(theme, event.type)

  return (
    <div className={styles.guest} style={themeToCssVars(theme)} data-tone={quiet ? 'respectful' : undefined} lang={lang}>
      <div className={styles.lang} role="group" aria-label="Language">
        {[['en', 'English', 'EN'], ['es', 'Español', 'ES']].map(([code, name, short]) => (
          <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)} lang={code}>
            <span aria-hidden="true">{short}</span><span className="visually-hidden">{name}</span>
          </button>
        ))}
      </div>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet context={{ event, theme, lang, quiet }} />
      </main>
      <footer className={styles.foot}>
        <span className={styles.plannedBy}>{lang === 'es' ? 'Organizado por' : 'Planned by'}</span>
        <BusinessMark business={state.business} />
        <PoweredBy />
      </footer>
    </div>
  )
}
