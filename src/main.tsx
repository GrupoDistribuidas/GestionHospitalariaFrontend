import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LoginScreen from './components/auth/LoginScreen.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginScreen />
  </StrictMode>,
)
