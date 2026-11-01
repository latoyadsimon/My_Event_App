// =====================================================================
// Help (/help): the How-To guide inside the app. Same words as
// documentation/HOW_TO.md (both come from src/data/howTo.js).
// "Show me" opens the screen as the right person, so every step can be tried.
// =====================================================================
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { HOW_TO, HOW_TO_INTRO, HOW_TO_TIPS } from '../../data/howTo'
import { Button } from '../../components/ui'
import styles from './Help.module.css'

/** **bold** in the guide's text → <strong> */
const rich = (text) => text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))

export default function Help() {
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const show = ({ to, role, clientId, memberId }) => {
    dispatch({ type: 'ui/setRole', role, clientId, memberId })
    navigate(to)
  }

  return (
    <div className={styles.help}>
      <header className={styles.head}>
        <h1 className={`display ${styles.title}`}>{HOW_TO_INTRO.title}</h1>
        <p className={styles.lead}>{HOW_TO_INTRO.lead}</p>
      </header>

      <section className={styles.demo} aria-labelledby="h-demo">
        <h2 id="h-demo" className={styles.sectionTitle}>About this demo</h2>
        <ul>{HOW_TO_INTRO.demo.map((d, i) => <li key={i}>{rich(d)}</li>)}</ul>
      </section>

      <nav className={styles.toc} aria-label="Guide contents">
        <ol>
          {HOW_TO.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a> <span className={styles.role}>{s.role}</span></li>)}
          <li><a href="#tips">Tips</a></li>
        </ol>
      </nav>

      {HOW_TO.map((section) => (
        <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`h-${section.id}`}>
          <p className={styles.role}>{section.role}</p>
          <h2 id={`h-${section.id}`} className={styles.sectionTitle}>{section.title}</h2>
          <p className="muted">{section.intro}</p>
          <ol className={styles.steps}>
            {section.steps.map((step) => (
              <li key={step.title} className={styles.step}>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p>{rich(step.text)}</p>
                </div>
                {step.show && <Button size="small" onClick={() => show(step.show)} aria-label={`Show me: ${step.title}`}>Show me</Button>}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section id="tips" className={styles.section} aria-labelledby="h-tips">
        <h2 id="h-tips" className={styles.sectionTitle}>Tips</h2>
        <ul className={styles.tips}>{HOW_TO_TIPS.map((tip, i) => <li key={i}>{rich(tip)}</li>)}</ul>
      </section>
    </div>
  )
}
