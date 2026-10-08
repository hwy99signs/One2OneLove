import React from 'react'

// RootErrorBoundary — the app's last line of defense.
//
// Wraps the entire application in main.jsx. If any component crashes while
// rendering, visitors see this branded recovery screen instead of a blank
// white page (the failure mode that took the site down on 2026-10-03, when a
// missing helper made the app fail during render with nothing to catch it).
//
// The caught error is stored on window.__O2OL_LAST_ERROR__ and logged to the
// console so it can be retrieved for support. When error tracking is added,
// its reporting call hooks into componentDidCatch below.
//
// The fallback uses inline styles only, on purpose: it must still render
// correctly even if the failure involves the app's own stylesheets.
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined') {
      window.__O2OL_LAST_ERROR__ = {
        message: (error && error.message) || String(error),
        stack: (error && error.stack) || null,
        componentStack: (info && info.componentStack) || null,
        at: new Date().toISOString(),
        path: window.location.pathname,
      }
    }
    console.error('[One2OneLove] Unhandled rendering error:', error, info)
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  handleHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f7f2e7',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div style={{ maxWidth: '440px', textAlign: 'center', color: '#1c2b4a' }}>
          <img
            src="/assets/o2ol-approved-logo.png"
            alt="One2OneLove"
            width="120"
            height="120"
            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '26px', lineHeight: 1.25, margin: '20px 0 10px' }}>
            Something went wrong on our end
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.55, margin: '0 0 24px', color: '#44506a' }}>
            We&rsquo;re sorry &mdash; this page didn&rsquo;t load the way it should. Your
            account and your information are safe. Please reload the page, or head back
            to the homepage.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                backgroundColor: '#cf102d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '12px 26px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload the page
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              style={{
                backgroundColor: 'transparent',
                color: '#1c2b4a',
                border: '2px solid #1c2b4a',
                borderRadius: '999px',
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to the homepage
            </button>
          </div>
          <p style={{ marginTop: '28px', fontSize: '13px', letterSpacing: '0.08em', color: '#8a7f63' }}>
            LOVE. GROW. EVOLVE. TOGETHER.
          </p>
        </div>
      </div>
    )
  }
}

export default RootErrorBoundary
