import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './contexts/I18nContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import { isChunkLoadError, reloadOnceForChunkError } from './utils/chunkReload'

// Recover from stale lazy chunks after a deploy. Vite fires `vite:preloadError`
// when an import() can't load its chunk; some failures arrive as unhandled
// rejections instead. Reload once (guarded) to pull the fresh, matching assets.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnceForChunkError();
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) reloadOnceForChunkError();
  });
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
)
