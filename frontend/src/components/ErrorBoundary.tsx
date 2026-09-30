import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-text mb-2">Une erreur est survenue</h1>
          <p className="text-text-3 mb-6">Quelque chose s'est mal passé. Veuillez rafraîchir la page.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover"
          >
            Rafraîchir
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
