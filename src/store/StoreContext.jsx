// =====================================================================
// Makes the store available to every component:
//   const { state, dispatch } = useStore()
// One provider at the top of the app (main.jsx). State lives in memory only.
// =====================================================================
import { createContext, useContext, useEffect, useReducer } from 'react'
import { reducer, initialState } from './reducer'

const StoreContext = createContext(null)

export function StoreProvider({ children, initial }) {
  const [state, dispatch] = useReducer(reducer, initial, (init) => init ?? initialState())

  // Calm / Bold lives on <html data-mode="…"> so tokens.css can restyle everything.
  useEffect(() => {
    if (state.ui.mode === 'bold') document.documentElement.dataset.mode = 'bold'
    else delete document.documentElement.dataset.mode
  }, [state.ui.mode])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore() must be used inside <StoreProvider>')
  return value
}
