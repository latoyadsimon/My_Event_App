// =====================================================================
// What every page sits inside:
//   • Suspense: a calm "Loading…" while a page's code downloads (lib/lazyPage.js)
//   • an error boundary: if a page crashes, say so plainly, keep the app
//     around it working, and offer a way out (NFR: plain-language errors)
//   • a short fade-in when the page changes (style guide §8; off for
//     reduced motion and the respectful tone)
//
//   <PageFrame><Outlet /></PageFrame>            inside an area's <main> (resets + animates per page)
//   <PageFrame outer><Outlet /></PageFrame>      around whole areas (no animation, no reset)
// =====================================================================
import { Component, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './PageFrame.module.css'

function Loading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.bar} aria-hidden="true" />
      <span className="visually-hidden">Loading…</span>
    </div>
  )
}

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Page crashed:', error, info.componentStack) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className={styles.crash} role="alert">
        <h1 className="display">Something went wrong on this page</h1>
        <p className="muted">Nothing you entered elsewhere was lost. Try again, or go back to the start.</p>
        <div className="cluster">
          <button type="button" className={styles.retry} onClick={() => this.setState({ error: null })}>Try again</button>
          <a href="/">Go to the start</a>
        </div>
      </div>
    )
  }
}

export default function PageFrame({ children, outer = false }) {
  const { pathname } = useLocation()
  if (outer) {
    return <ErrorBoundary><Suspense fallback={<Loading />}>{children}</Suspense></ErrorBoundary>
  }
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<Loading />}>
        <div className={styles.enter} key={pathname}>{children}</div>
      </Suspense>
    </ErrorBoundary>
  )
}
