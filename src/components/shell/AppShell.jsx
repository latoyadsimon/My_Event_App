// =====================================================================
// The frame around a signed-in area (planner workspace, client portal, staff).
// Same pattern as the wireframes' shell():
//   desktop (≥1024px)  sidebar on the left
//   tablet  (768–1023) top bar + a row of tabs
//   phone   (<768)     top bar + a bottom tab bar with 4 items and "More (n)";
//                      the current page always takes one of the 4 visible slots.
//
// items: [{ to, label, icon, end, locked, lockNote }]
//   locked items show a lock and can't be opened (e.g. portal before the deposit).
// =====================================================================
import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom'
import Icon from '../ui/Icon'
import PageFrame from './PageFrame'
import styles from './AppShell.module.css'

const PHONE_SLOTS = 4

function isActive(item, pathname) {
  return Boolean(matchPath({ path: item.to, end: Boolean(item.end) }, pathname))
}

function NavItem({ item, className }) {
  if (item.locked) {
    return (
      <span className={`${className} ${styles.locked}`} aria-disabled="true" title={item.lockNote}>
        <Icon name="lock" size={18} />
        <span>{item.label}</span>
        <span className="visually-hidden">(locked: {item.lockNote})</span>
      </span>
    )
  }
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive: on }) => `${className} ${on ? styles.active : ''}`}>
      <Icon name={item.icon} size={18} />
      <span>{item.label}</span>
    </NavLink>
  )
}

/** Phone bottom bar: 4 slots + More (n). */
function BottomBar({ items, label }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const moreRef = useRef(null)

  // Close the More panel when the page changes, adjusting state during render
  // (React's recommended alternative to an effect for this).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); moreRef.current?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  let visible = items
  let rest = []
  if (items.length > PHONE_SLOTS) {
    visible = items.slice(0, PHONE_SLOTS)
    const activeIndex = items.findIndex((it) => isActive(it, pathname))
    if (activeIndex >= PHONE_SLOTS) visible = [...items.slice(0, PHONE_SLOTS - 1), items[activeIndex]]
    rest = items.filter((it) => !visible.includes(it))
  }

  return (
    <nav className={styles.bottomBar} aria-label={label}>
      <ul role="list" className={styles.bottomList}>
        {visible.map((item) => (
          <li key={item.to}><NavItem item={item} className={styles.bottomItem} /></li>
        ))}
        {rest.length > 0 && (
          <li className={styles.moreWrap}>
            <button
              ref={moreRef}
              type="button"
              className={styles.bottomItem}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name="more" size={18} />
              <span>More ({rest.length})</span>
            </button>
            <ul role="list" id={panelId} className={styles.morePanel} hidden={!open}>
              {rest.map((item) => (
                <li key={item.to}><NavItem item={item} className={styles.moreItem} /></li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default function AppShell({ brand, items, navLabel, sideNote, footer, topRight, className = '', children }) {
  return (
    <div className={`${styles.shell} ${className}`}>
      <header className={styles.side}>
        <div className={styles.brand}>{brand}</div>
        {topRight && <div className={styles.topRight}>{topRight}</div>}
        <nav className={styles.mainNav} aria-label={navLabel}>
          <ul role="list" className={styles.navList}>
            {items.map((item) => (
              <li key={item.to}><NavItem item={item} className={styles.navItem} /></li>
            ))}
          </ul>
          {sideNote && <p className={styles.sideNote}>{sideNote}</p>}
        </nav>
        {footer && <div className={styles.sideFooter}>{footer}</div>}
      </header>

      <main id="main" className={styles.main} tabIndex={-1}>
        <PageFrame>{children ?? <Outlet />}</PageFrame>
      </main>

      <BottomBar items={items} label={navLabel} />
    </div>
  )
}
