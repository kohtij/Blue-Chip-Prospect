import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Catches any render-time exception in App and shows the actual error
// instead of a black screen. Without this, one undefined variable in any
// screen renders the whole app blank.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh',
        padding: '32px',
        color: '#f8fafc',
        background: '#040505',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          background: '#101410',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 12, padding: 32,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,.5)'
        }}>
          <p style={{
            fontSize: 11, letterSpacing: '.15em',
            color: '#ef4444', margin: 0, textTransform: 'uppercase', fontWeight: 900
          }}>Something crashed the game</p>
          <h1 style={{ fontSize: 26, margin: '8px 0 20px', fontWeight: 900 }}>
            {this.state.error?.name || 'Error'}: {this.state.error?.message}
          </h1>
          <pre style={{
            background: '#050706', padding: 16, borderRadius: 8,
            border: '1px solid rgba(255,255,255,.065)',
            overflow: 'auto', fontSize: 12, lineHeight: 1.5,
            color: '#94a3b8'
          }}>
{(this.state.error?.stack || '').split('\n').slice(0, 12).join('\n')}
{'\n\n--- Component stack ---\n'}
{(this.state.info?.componentStack || '').split('\n').slice(0, 12).join('\n')}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20, padding: '10px 24px',
              background: '#22E748', color: '#000',
              border: 'none', borderRadius: 8, fontWeight: 900,
              cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase'
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)