import { Component } from 'react';

/**
 * Catches render errors so one broken component doesn't take the whole app down.
 *
 * Without this, any exception thrown during render unmounts the entire tree and
 * leaves a blank white page — no message, no way back except a manual reload.
 * That is the worst possible failure mode for a tool being used at a table
 * mid-session, and it's also indistinguishable from "the site is down", so it
 * gets reported as an outage rather than as the specific bug it is.
 *
 * Deliberately plain: this renders when something has already gone wrong, so it
 * uses no app CSS, no context, no icon library and no hooks. Anything it
 * depended on could be the thing that's broken.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the component stack — it's the part that actually says which
    // component failed, and it is not in error.stack.
    console.error('[ErrorBoundary] render error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Drop any query string (?chronicle=…, ?campaign=…) — if the crash came
    // from the route being restored, returning to it just crashes again.
    window.location.href = window.location.origin;
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error?.message || String(this.state.error);

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0E0B1F',
          color: '#F3EEFF',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%' }}>
          <h1 style={{ fontSize: 20, margin: '0 0 12px' }}>Something broke on this screen</h1>
          <p style={{ margin: '0 0 8px', lineHeight: 1.5, color: '#B9B0D6' }}>
            The rest of your campaign is fine — nothing has been lost. This is a bug
            in the page you were looking at, not a problem with your data.
          </p>
          <p style={{ margin: '0 0 20px', lineHeight: 1.5, color: '#8278A4', fontSize: 14 }}>
            If you can, note what you were doing when it happened.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                minHeight: 44, padding: '0 20px', borderRadius: 8, cursor: 'pointer',
                background: '#8B5CF6', color: '#fff', border: 'none', fontSize: 16,
              }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                minHeight: 44, padding: '0 20px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', color: '#F3EEFF',
                border: '1px solid rgba(255,255,255,0.25)', fontSize: 16,
              }}
            >
              Back to start
            </button>
          </div>

          <details style={{ marginTop: 24, color: '#8278A4', fontSize: 13 }}>
            <summary style={{ cursor: 'pointer' }}>Technical detail</summary>
            <pre
              style={{
                marginTop: 12, padding: 12, borderRadius: 8, overflowX: 'auto',
                background: 'rgba(0,0,0,0.35)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
