// A stand-in for a screen that a later phase builds. It names the screen,
// says which phase builds it, and keeps the click path working.
import { Link } from 'react-router-dom'
import { SCREENS, PHASE_NAMES } from '../../routes/screens'
import { Card, PageHeader } from '../../components/ui'

// nested: the screen sits under a parent that already has the page's <h1>
// (Event Hub tabs, Settings sections), so its title becomes the card's <h2>.
export default function Planned({ id, title, nested = false }) {
  const screen = SCREENS[id]
  const name = title ?? screen.title
  return (
    <>
      {!nested && <PageHeader title={name} />}
      <Card title={nested ? name : `Built in Phase ${screen.phase}: ${PHASE_NAMES[screen.phase]}`}>
        {nested && <p>Built in Phase {screen.phase}: {PHASE_NAMES[screen.phase]}.</p>}
        <p className="muted">
          The stories and wireframe for this screen are in <code>app_outline/pages/{screen.folder}/</code>.
        </p>
        {screen.next.length > 0 && (
          <nav aria-label="Where to next">
            <ul role="list" className="cluster">
              {screen.next.map((n) => (
                <li key={n.to}><Link to={n.to} relative="path">{n.label}</Link></li>
              ))}
            </ul>
          </nav>
        )}
      </Card>
    </>
  )
}
