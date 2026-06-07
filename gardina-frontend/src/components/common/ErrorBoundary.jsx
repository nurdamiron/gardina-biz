import React from 'react';
import { isChunkLoadError, reloadOnceForChunkError } from '../../utils/chunkReload';

/**
 * Catches render-time errors anywhere below it and shows a friendly fallback
 * instead of React's white screen of death. Logs to console (and Sentry once
 * we wire it up) so we can debug what crashed.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    return { error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error, info) {
    // A failed lazy-chunk import after a deploy is not a real crash — the tab is
    // running a stale build. Reload once to pull fresh, matching assets.
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
    if (typeof window !== 'undefined' && typeof window.gardinaReportError === 'function') {
      try { window.gardinaReportError(error, info); } catch { /* noop */ }
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  reload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    // Stale build after a deploy — we're reloading; show a calm spinner, not
    // the error card (a reload is already in flight from componentDidCatch).
    if (this.state.isChunkError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-light p-6 gap-4">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-text-secondary">Жаңартылуда…</p>
        </div>
      );
    }

    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-light p-6">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center">
            <div className="mx-auto mb-4 size-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive" aria-hidden="true">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-main mb-2">
              Қате орын алды
            </h1>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Бетті жүктеу кезінде қате болды. Бұл туралы бізге автоматты түрде
              хабарландық. Бетті қайта жүктеңіз немесе басты бетке оралыңыз.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.reload}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all"
              >
                Бетті жаңарту
              </button>
              <button
                onClick={this.reset}
                className="px-5 py-2.5 rounded-xl border border-border text-text-main font-bold text-sm hover:bg-muted transition-all"
              >
                Жабу
              </button>
            </div>
            {import.meta.env.DEV && (
              <pre className="mt-6 text-xs text-left bg-red-50 text-red-900 p-3 rounded-lg overflow-x-auto">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
