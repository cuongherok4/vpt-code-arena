import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const savedTheme = localStorage.getItem('vpt-theme')
const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches
const theme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : systemLight ? 'light' : 'dark'
document.documentElement.dataset.theme = theme
document.documentElement.classList.toggle('dark', theme === 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
