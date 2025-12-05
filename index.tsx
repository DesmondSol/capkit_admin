import React, { ReactNode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>Application Error</h1>
          <p style={{ color: '#334155', marginBottom: '24px' }}>Something went wrong while rendering the dashboard.</p>
          <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', overflow: 'auto', border: '1px solid #e2e8f0' }}>
            <code style={{ color: '#ef4444', fontSize: '12px' }}>
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '24px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Robust root creation for React 18 via esm.sh
const root = createRoot(container);

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("React Root Mounted Successfully");
} catch (e) {
  console.error("Failed to render root:", e);
  container.innerHTML = `<div style="color:red; padding:20px;">Failed to start app: ${e}</div>`;
}