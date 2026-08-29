import { Component } from 'react';

// ErrorBoundary wraps the main screen router. If any screen component throws
// during render, this catches it and shows a recoverable error card instead of
// silently blanking the right panel of the app. Provides the error message and
// a "Return to Preseason" button so a crash never traps the player.
//
// React error boundaries have to be class components — this is one of the
// few things you literally can't do with hooks. Do not convert to a function.

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the crash to the browser console with a distinctive prefix so it's
    // easy to spot in dev tools. The full component stack is often the most
    // useful part for tracing which screen actually threw.
    console.error('[ErrorBoundary] Screen crashed:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
  }

  handleRecover = () => {
    // Clear the error state, then hand back control by triggering the recover
    // callback provided by the parent (which resets the screen back to a safe
    // default like preseason).
    this.setState({ hasError: false, error: null });
    if (this.props.onRecover) {
      this.props.onRecover();
    }
  };

  handleReload = () => {
    // Nuclear option — reload the whole page. Loses in-memory state but the
    // player's save should persist if the app writes to localStorage.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMsg = this.state.error?.message || String(this.state.error) || 'Unknown error';
    const errorName = this.state.error?.name || 'Error';

    return (
      <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#ef4444] shadow-[0_0_40px_rgba(239,68,68,0.2)]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl sm:text-3xl font-black sports-font uppercase tracking-tighter text-[#ef4444] mb-3">
            Something Went Wrong
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6 font-sans leading-relaxed">
            The screen you were on hit an error and stopped rendering. Your career progress is not lost, but the current screen can't recover on its own.
          </p>

          <div className="bg-[#101410] border border-[#ef4444]/30 rounded-xl p-4 sm:p-5 mb-6 text-left overflow-hidden">
            <div className="text-[10px] sm:text-xs font-black text-[#ef4444] uppercase tracking-widest mb-2 font-sans">
              Error Details (share these with Claude to help debug)
            </div>
            <div className="font-mono text-xs sm:text-sm text-slate-200 break-words whitespace-pre-wrap">
              <span className="text-[#ef4444] font-bold">{errorName}:</span> {errorMsg}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRecover}
              className="btn-primary py-3 px-6 rounded-xl font-black sports-font tracking-widest text-sm sm:text-base uppercase shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              Return to Preseason
            </button>
            <button
              onClick={this.handleReload}
              className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.15)] text-slate-300 hover:text-white py-3 px-6 rounded-xl font-black sports-font tracking-widest text-sm sm:text-base uppercase cursor-pointer transition-colors"
            >
              Reload Page
            </button>
          </div>

          <p className="text-[10px] sm:text-xs text-slate-500 mt-6 font-sans italic">
            Open browser dev tools (F12) → Console tab for a full stack trace.
          </p>
        </div>
      </div>
    );
  }
}
