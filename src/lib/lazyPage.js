// =====================================================================
// Load each page only when it's first opened (code splitting), so a guest
// opening an invitation doesn't download the whole planner app.
//
//   const Leads = lazyPage(() => import('../pages/planner/leads/Leads'))
//   const Rsvp  = lazyPage(() => import('../pages/guest/GuestPages'), 'Rsvp')
//
// While a page loads, the nearest <Suspense> shows its fallback. Tests call
// preloadAllPages() first, so pages render right away there.
// =====================================================================
import { createElement, use } from 'react'

const loaders = []

export function lazyPage(load, exportName = 'default') {
  let promise = null
  // Mark the promise fulfilled once loaded, so use() returns the page right away
  // instead of suspending again (React reads status/value off the promise).
  const ensure = () => (promise ??= load().then((m) => {
    Object.assign(promise, { status: 'fulfilled', value: m[exportName] })
    return m[exportName]
  }))
  loaders.push(ensure)

  function Page(props) {
    const Component = use(ensure())   // called on every render, as React requires
    return createElement(Component, props)
  }
  Page.displayName = `Lazy(${exportName})`
  return Page
}

/** Load every page now (tests; or to warm the cache after the first screen). */
export const preloadAllPages = () => Promise.all(loaders.map((ensure) => ensure()))
