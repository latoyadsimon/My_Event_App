// Business details (PL-1.2). Used by onboarding step 1 and Settings › Business.
// Controlled fields: the page that uses them owns the values and saving.
import { Field } from '../../../components/ui'
import styles from './setup.module.css'

const TIMEZONES = [
  ['America/New_York', 'Eastern'], ['America/Chicago', 'Central'], ['America/Denver', 'Mountain'],
  ['America/Phoenix', 'Arizona'], ['America/Los_Angeles', 'Pacific'], ['America/Anchorage', 'Alaska'], ['Pacific/Honolulu', 'Hawaii'],
]

export default function BusinessFields({ values, errors = {}, onChange }) {
  const bind = (key) => ({ value: values[key] ?? '', onChange: (e) => onChange({ ...values, [key]: e.target.value }), error: errors[key] })
  return (
    <div className={styles.grid2}>
      <div className={styles.full}><Field label="Business name" autoComplete="organization" {...bind('name')} /></div>
      <Field label="Business email" type="email" autoComplete="email" hint="Clients reply to this address." {...bind('email')} />
      <Field label="Phone" type="tel" autoComplete="tel" {...bind('phone')} />
      <Field label="City" autoComplete="address-level2" {...bind('city')} />
      <Field label="Time zone" as="select" hint="New events start in this time zone." {...bind('timezone')}>
        {TIMEZONES.map(([id, name]) => <option key={id} value={id}>{name} ({id})</option>)}
      </Field>
      <div className={styles.full}>
        <Field label="Custom domain (optional)" placeholder="events.yourbusiness.com" autoCapitalize="none"
          hint="Clients and guests see your pages at this address instead of crowned.app." {...bind('customDomain')} />
      </div>
    </div>
  )
}
