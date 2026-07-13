import { Component, ReactNode } from 'react';
import { Hexagon, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Top-level safety net: without this, a render throw anywhere in the tree
// (context providers, pages, components) unmounts the whole app to a blank
// white screen with no way to recover short of a manual reload.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20">
            <Hexagon size={32} className="text-lime-500" />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              FinMate hit an unexpected error. Reloading usually fixes it.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent-brand, #84cc16)', color: '#fff' }}
          >
            <RefreshCcw size={14} />
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
