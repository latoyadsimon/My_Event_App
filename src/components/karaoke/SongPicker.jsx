// A list of songs you build by searching the catalog (must-play, do-not-play, banned).
//   <SongPicker label="Must-play" value={ids} onChange={setIds} />
import { useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { Field, Icon } from '../ui'
import styles from './SongPicker.module.css'

export default function SongPicker({ label, value, onChange, hint }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const matches = term ? state.songs.filter((s) => !value.includes(s.id) && `${s.title} ${s.artist}`.toLowerCase().includes(term)).slice(0, 6) : []
  const picked = value.map((id) => state.songs.find((s) => s.id === id)).filter(Boolean)
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{label}</legend>
      {picked.length > 0 && (
        <ul role="list" className={styles.chips}>
          {picked.map((s) => (
            <li key={s.id} className={styles.chip}>
              {s.title} <span className={styles.artist}>· {s.artist}</span>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s.id))} aria-label={`Remove ${s.title} from ${label}`}><Icon name="close" size={12} /></button>
            </li>
          ))}
        </ul>
      )}
      <Field label={`Add to ${label.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} hint={hint} autoComplete="off" />
      {matches.length > 0 && (
        <ul role="list" className={styles.matches} aria-label={`Songs matching “${q}”`}>
          {matches.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => { onChange([...value, s.id]); setQ('') }}>
                + {s.title} <span className={styles.artist}>· {s.artist}{s.explicit ? ' · explicit' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
