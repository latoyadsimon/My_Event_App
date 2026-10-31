// Runs before every test file: adds matchers like toBeInTheDocument() and toHaveAccessibleName().
import '@testing-library/jest-dom/vitest'

// jsdom has no <dialog> methods yet; give it the two we use.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true }
  HTMLDialogElement.prototype.close = function close() { this.open = false }
}

// jsdom doesn't scroll; RootLayout calls window.scrollTo on every page change.
window.scrollTo = () => {}
