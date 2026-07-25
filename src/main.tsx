import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { PwaUpdatePrompt } from '@/app/PwaUpdatePrompt'
import { router } from '@/app/router'
import '@/styles/globals.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <PwaUpdatePrompt />
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
