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

// Prerendered pages hydrate — but only when the markup was rendered for this exact route. Hosts that fall back
// to another page's HTML, and query-string variants (e.g. /contact?intent=quote) that render differently,
// are client-rendered instead to avoid hydration mismatches.
const norm = (p: string) => p.replace(/\/+$/, '') || '/'
const prerenderedFor = container.dataset.route
if (container.firstElementChild && prerenderedFor && norm(prerenderedFor) === norm(location.pathname) && !location.search) hydrateRoot(container, app)
else {
  container.textContent = ''
  createRoot(container).render(app)
}
;(window as Window & { __booted?: boolean }).__booted = true
