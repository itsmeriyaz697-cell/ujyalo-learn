import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './Feedback';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render failures so a single broken page does not blank the app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log the message only; never log user content or secrets.
    console.error('[ujyalo] UI error:', error.message, info.componentStack?.split('\n')[1]);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-md">
            <ErrorState
              title="This page ran into a problem"
              message="Your saved notes and progress are safe. Try reloading the page."
              onRetry={() => window.location.reload()}
              retryLabel="Reload page"
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
