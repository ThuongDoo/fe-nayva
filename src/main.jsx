import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import AuthGate from './components/AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate />
    {/* TEMP: marks the dev branch build; remove before merging into main. */}
    <div className="dev-badge" aria-hidden="true">DEV</div>
  </StrictMode>,
)
