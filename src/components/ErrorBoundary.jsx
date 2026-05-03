import { Component } from 'react';
import { Button } from './ui/Button';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('App error:', error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E0DED8] p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-2xl">⚠️</div>
          <div>
            <h1 className="font-bold text-lg text-[#1A1A18]">Something went wrong</h1>
            <p className="text-sm text-[#6B6B66] mt-1">An unexpected error occurred. You can try reloading the page.</p>
          </div>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="text-left text-[11px] bg-[#F5F4F0] rounded-lg p-3 text-[#6B6B66] overflow-x-auto">{this.state.error.message}</pre>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={this.reset}>Dismiss</Button>
            <Button variant="primary" onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      </div>
    );
  }
}
