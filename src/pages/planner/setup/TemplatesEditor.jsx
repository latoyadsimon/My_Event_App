// =====================================================================
// Starter templates (PL-1.7): which checklist each event type starts with,
// and the wording of automatic messages. Changes apply to NEW events only.
// {curly} words are filled in for each client when the message is sent.
// =====================================================================
import { useState } from 'react'
import { useStore } from '../../../store/StoreContext'
import { Button, Card, Field } from '../../../components/ui'
import styles from './setup.module.css'

const EVENT_TYPES = [
  ['wedding', 'Weddings'], ['birthday', 'Birthdays'], ['baby_shower', 'Baby showers'], ['bridal_shower', 'Bridal showers'],
  ['corporate', 'Corporate'], ['fundraiser', 'Fundraisers'], ['memorial', 'Memorials'], ['other', 'Everything else'],
]
const CHECKLISTS = ['Wedding · 12 months', 'Wedding · 6 months (short engagement)', 'Birthday · 8 weeks', 'Shower · 6 weeks',
  'Corporate · 10 weeks', 'Fundraiser · 16 weeks', 'Memorial · 2 weeks', 'General · 8 weeks', 'None (start empty)']
const MESSAGES = [
  ['autoReply', 'Inquiry auto-reply', 'Sent right away when someone fills in your inquiry form.'],
  ['paymentReminder', 'Payment reminder', 'Texted 7 days and 1 day before each payment is due.'],
]

export default function TemplatesEditor() {
  const { state, dispatch } = useStore()
  const { checklists, messages } = state.business.templates
  const [drafts, setDrafts] = useState(messages)

  const saveMessages = (e) => {
    e.preventDefault()
    for (const [key] of MESSAGES) dispatch({ type: 'templates/update', path: ['messages', key], value: drafts[key] })
    dispatch({ type: 'toast/show', text: 'Message templates saved' })
  }

  return (
    <div className="stack">
      <Card title="Starter checklists">
        <p className={styles.help}>Each new event starts with this checklist. Edits apply to new events only.</p>
        <div className={styles.grid2}>
          {EVENT_TYPES.map(([type, label]) => (
            <Field key={type} label={label} as="select" value={checklists[type] ?? 'None (start empty)'}
              onChange={(e) => dispatch({ type: 'templates/update', path: ['checklists', type], value: e.target.value })}>
              {CHECKLISTS.map((c) => <option key={c}>{c}</option>)}
            </Field>
          ))}
        </div>
      </Card>

      <Card title="Message templates">
        <form className="stack" onSubmit={saveMessages}>
          {MESSAGES.map(([key, label, hint]) => (
            <Field key={key} label={label} hint={`${hint} Words in {curly braces} are filled in for you.`} as="textarea"
              value={drafts[key]} onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })} />
          ))}
          <div className={styles.formActions}><Button type="submit" variant="primary">Save templates</Button></div>
        </form>
      </Card>
    </div>
  )
}
