// Settings › Appearance: Calm (default) or Bold, per person (style guide §2, layer 1).
// The choice applies instantly. Client and guest pages never change: they wear
// the planner's brand and the event theme instead.
import { useStore } from '../../../store/StoreContext'
import { Card } from '../../../components/ui'
import styles from './Appearance.module.css'

const OPTIONS = [
  { id: 'calm', name: 'Calm', text: 'Ivory, deep plum and rose, with an elegant serif. Easy on the eyes all day.' },
  { id: 'bold', name: 'Bold', text: 'Graffiti × princess power on a neon-arcade night. Spray-paint headings and a glow.' },
]

export default function Appearance() {
  const { state, dispatch } = useStore()
  return (
    <Card title="Appearance">
      <fieldset className={styles.fieldset}>
        <legend className="muted">How your workspace looks to you. Your clients and guests always see your brand and the event&apos;s theme.</legend>
        <div className={styles.options}>
          {OPTIONS.map((o) => (
            <label key={o.id} className={styles.option}>
              <input
                type="radio" name="mode" value={o.id} className={styles.radio}
                checked={state.ui.mode === o.id}
                onChange={() => dispatch({ type: 'ui/setMode', mode: o.id })}
              />
              <span className={`${styles.preview} ${styles[o.id]}`} aria-hidden="true">
                <span className={styles.previewTitle}>Aa</span>
                <span className={styles.previewBar} />
                <span className={styles.previewChip} />
              </span>
              <span className={styles.name}>{o.name}{o.id === 'calm' && <span className="muted"> (default)</span>}</span>
              <span className={styles.text}>{o.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  )
}
