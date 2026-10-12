import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import './fonts'
import './styles.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Prerendered pages hydrate. Query-string variants (e.g. /contact?intent=quote) render differently from the
// prerendered HTML, so they are client-rendered to avoid hydration mismatches.
if (container.firstElementChild && !location.search) hydrateRoot(container, app)
else {
  container.textContent = ''
  createRoot(container).render(app)
}
;(window as Window & { __booted?: boolean }).__booted = true
