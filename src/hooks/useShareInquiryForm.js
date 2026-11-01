// "Copy link" for the public inquiry form (Dashboard checklist, Leads board).
// Copies the URL, marks the checklist item done and says so in a toast.
import { useStore } from '../store/StoreContext'

export function useShareInquiryForm() {
  const { state, dispatch } = useStore()
  const url = `${window.location.origin}/b/${state.business.slug}/inquire`
  return async () => {
    try { await navigator.clipboard?.writeText(url) } catch { /* clipboard blocked: the link is still on the page */ }
    dispatch({ type: 'business/inquiryFormShared' })
    dispatch({ type: 'toast/show', text: 'Inquiry form link copied. Paste it on your website or Instagram.' })
  }
}
