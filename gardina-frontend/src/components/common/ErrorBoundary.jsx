import React from 'react';

/**
 * Catches render-time errors anywhere below it and shows a friendly fallback
 * instead of React's white screen of death. Logs to console (and Sentry once
 * we wire it up) so we can debug what crashed.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
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
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-light p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-3">⚠️</div>
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
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-text-main font-bold text-sm hover:bg-gray-50 transition-all"
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
