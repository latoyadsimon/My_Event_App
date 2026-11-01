// =====================================================================
// Logo and brand color (PL-1.2, NFR-15). Shows how clients will see it.
// If the color is too light for white text, we say so and show the darker
// shade we'll use instead (brandInk), so every planner's pages pass WCAG AA.
// The logo stays in memory as a data URL (Supabase Storage later).
// =====================================================================
import { useId, useState } from 'react'
import { brandInk, isHexColor } from '../../../lib/brand'
import { Field } from '../../../components/ui'
import styles from './setup.module.css'

const PRESETS = ['#A3336A', '#5E479C', '#1F6B8C', '#2F7D4F', '#C2410C', '#F9C74F', '#2E1A3A']
const MAX_LOGO_BYTES = 2 * 1024 * 1024

export default function BrandingFields({ values, onChange, businessName }) {
  const logoId = useId()
  const [logoError, setLogoError] = useState('')
  const color = values.brandColors?.[0] ?? '#A3336A'
  const [hexText, setHexText] = useState(color)
  const ink = brandInk(color)

  const setColor = (hex) => {
    setHexText(hex)
    if (isHexColor(hex)) onChange({ ...values, brandColors: [hex.toUpperCase(), ...(values.brandColors ?? []).slice(1)] })
  }

  const pickLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setLogoError('Please choose an image file (PNG, JPG or SVG).')
    if (file.size > MAX_LOGO_BYTES) return setLogoError('That image is over 2 MB. Please choose a smaller one.')
    setLogoError('')
    const reader = new FileReader()
    reader.onload = () => onChange({ ...values, logo: reader.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className={styles.brandRow}>
      <div className="stack">
        <div className="stack" style={{ '--stack-gap': 'var(--space-2)' }}>
          <label htmlFor={logoId} className={styles.sectionTitle}>Logo</label>
          <div className={styles.logoBox}>
            <span className={styles.logoPreview}>{values.logo ? <img src={values.logo} alt="Your logo" /> : 'No logo yet'}</span>
            <input id={logoId} className={styles.fileInput} type="file" accept="image/*" onChange={pickLogo} aria-describedby={`${logoId}-help`} />
            {values.logo && <button type="button" className="link-button" onClick={() => onChange({ ...values, logo: null })}>Remove logo</button>}
          </div>
          <span id={`${logoId}-help`} className={styles.help}>PNG, JPG or SVG, up to 2 MB. Until you add one, we show your initials.</span>
          {logoError && <span className={styles.help} role="alert" style={{ color: 'var(--status-danger-ink)' }}>{logoError}</span>}
        </div>

        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, '--stack-gap': 'var(--space-2)' }}>
          <legend className={styles.sectionTitle}>Brand color</legend>
          <div className={styles.swatches}>
            {PRESETS.map((hex) => (
              <button key={hex} type="button" className={styles.swatch} style={{ background: hex }}
                aria-pressed={color.toUpperCase() === hex} aria-label={`Use ${hex}`} onClick={() => setColor(hex)} />
            ))}
            <input type="color" className={styles.colorPick} value={color} onChange={(e) => setColor(e.target.value)} aria-label="Pick any color" />
          </div>
          <div className={styles.hexField}>
            <Field label="Hex code" value={hexText} onChange={(e) => setColor(e.target.value)} spellCheck="false"
              error={isHexColor(hexText) ? undefined : 'Use 6 digits after #, like #A3336A'} />
          </div>
        </fieldset>
      </div>

      <div className="stack" style={{ '--stack-gap': 'var(--space-2)' }}>
        <span className={styles.sectionTitle}>How clients and guests see it</span>
        <div className={styles.preview} aria-hidden="true">
          <div className={styles.previewHead}>
            {values.logo
              ? <img src={values.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              : <span style={{ background: ink, color: '#FFF', width: 32, height: 32, borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>
                  {(businessName || 'Your Business').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </span>}
            <strong>{businessName || 'Your business'}</strong>
          </div>
          <div className={styles.previewBody}>
            <span>Your proposal is ready to review.</span>
            <span className={styles.previewBtn} style={{ background: ink }}>View proposal</span>
          </div>
        </div>
        <p className={styles.previewCaption} aria-live="polite">
          {ink === color.toUpperCase()
            ? 'White text reads clearly on this color.'
            : `This color is light, so buttons and text use a darker shade (${ink}) that everyone can read.`}
        </p>
      </div>
    </div>
  )
}
