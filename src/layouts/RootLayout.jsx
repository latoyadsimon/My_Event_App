// The outermost frame: skip link, demo bar, the current area, and toasts.
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import DemoBar from '../components/shell/DemoBar'
import Toasts from '../components/shell/Toasts'

export default function RootLayout() {
  const { pathname } = useLocation()

  // A new page starts at the top (single-page apps keep the old scroll position otherwise).
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <DemoBar />
      <Outlet />
      <Toasts />
    </>
  )
}
