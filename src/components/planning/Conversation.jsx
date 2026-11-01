// A message thread with a composer (attach a file, optional extra buttons).
// Used by Event Hub › Messages (planner) and Portal › Messages (client).
//   <Conversation thread={t} me="planner" onSend={(text, attachmentName) => …} extra={<Button…/>} />
import { useState } from 'react'
import { formatDateTime } from '../../lib/clock'
import { Button, Field, Icon } from '../ui'
import styles from './planning.module.css'

export default function Conversation({ thread, me, onSend, sendLabel = 'Send', extra }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text, file?.name)
    setText(''); setFile(null)
  }
  return (
    <div className={styles.conversation}>
      <ol role="list" className={styles.messages} aria-label={`Messages with ${thread.name}`} tabIndex={0}>
        {thread.messages.length === 0 && <li className="muted">No messages yet.</li>}
        {thread.messages.map((m) => (
          <li key={m.id} className={m.from === me ? styles.mine : styles.theirs}>
            <p className={styles.bubbleMeta}>{m.author} · {formatDateTime(m.at)}</p>
            <p className={styles.bubble}>{m.text}</p>
            {m.attachment && <p className={styles.attachment}><Icon name="proposal" size={14} /> {m.attachment}</p>}
            {m.delivery?.failed?.map((f) => (
              <p key={f.name} className={styles.failed}>⚠ Not delivered to {f.name} by {f.channel} ({f.reason})</p>
            ))}
          </li>
        ))}
      </ol>
      <form className={styles.composer} onSubmit={send}>
        <Field label="Message" as="textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="cluster">
          <label className={styles.uploadButton}>
            <Icon name="proposal" size={14} /> {file ? file.name : 'Attach a file'}
            <input type="file" className="visually-hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {extra}
          <span className="spacer" />
          <Button type="submit" variant="primary" disabled={!text.trim()}>{sendLabel}</Button>
        </div>
      </form>
    </div>
  )
}

