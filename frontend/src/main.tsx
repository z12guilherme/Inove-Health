import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-background)',
          color: 'var(--color-foreground)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  </StrictMode>,
)
