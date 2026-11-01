// =====================================================================
// The Settings pages. Each one reuses a setup component (the same one the
// onboarding wizard uses), so a form is built once and works in both places.
// =====================================================================
import { useState } from 'react'
import { useStore } from '../../../store/StoreContext'
import { validateBusiness } from '../../../lib/validate'
import { nowStamp } from '../../../lib/clock'
import { Button, Card } from '../../../components/ui'
import BusinessFields from '../setup/BusinessFields'
import BrandingFields from '../setup/BrandingFields'
import PackagesManager from '../setup/PackagesManager'
import TeamManager from '../setup/TeamManager'
import TemplatesEditor from '../setup/TemplatesEditor'
import { CalendarConnect, PaymentsConnect } from '../setup/ConnectCards'
import styles from '../setup/setup.module.css'

const BUSINESS_KEYS = ['name', 'email', 'phone', 'city', 'timezone', 'customDomain']
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? '']))

export function BusinessSettings() {
  const { state, dispatch } = useStore()
  const [values, setValues] = useState(() => pick(state.business, BUSINESS_KEYS))
  const [errors, setErrors] = useState({})

  const save = (e) => {
    e.preventDefault()
    const found = validateBusiness(values)
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'business/update', changes: { ...values, name: values.name.trim() } })
    dispatch({ type: 'toast/show', text: 'Business details saved' })
  }

  return (
    <Card title="Business">
      <form className="stack" onSubmit={save} noValidate>
        <BusinessFields values={values} errors={errors} onChange={setValues} />
        <div className={styles.formActions}><Button type="submit" variant="primary">Save changes</Button></div>
      </form>
    </Card>
  )
}

export function BrandingSettings() {
  const { state, dispatch } = useStore()
  const [values, setValues] = useState(() => ({ logo: state.business.logo, brandColors: state.business.brandColors }))
  const save = (e) => {
    e.preventDefault()
    dispatch({ type: 'business/update', changes: values })
    dispatch({ type: 'toast/show', text: 'Branding saved. Your client and guest pages use it now.' })
  }
  return (
    <Card title="Branding">
      <form className="stack" onSubmit={save}>
        <BrandingFields values={values} onChange={setValues} businessName={state.business.name} />
        <div className={styles.formActions}><Button type="submit" variant="primary">Save branding</Button></div>
      </form>
    </Card>
  )
}

export const PackagesSettings = () => <PackagesManager />
export const PaymentsSettings = () => <Card title="Payments"><PaymentsConnect /></Card>
export const CalendarSettings = () => <Card title="Calendar sync"><CalendarConnect /></Card>
export const TeamSettings = () => <TeamManager />
export const TemplatesSettings = () => <TemplatesEditor />

/** Everything in this business as one JSON file (data portability). */
export function ExportSettings() {
  const { state } = useStore()
  const download = () => {
    const data = { ...state }
    delete data.ui        // demo settings, not business data
    delete data.toasts
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: `${state.business.slug}-export-${nowStamp().slice(0, 10)}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Card title="Data export">
      <p className={styles.help}>
        Download everything in {state.business.name}: clients, leads, proposals, events, invoices, tasks and your settings,
        as one JSON file. It&apos;s yours, and you can take it anywhere.
      </p>
      <div><Button variant="secondary" onClick={download}>Download my data</Button></div>
    </Card>
  )
}
