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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Une erreur est survenue</h1>
          <p className="text-gray-500 mb-6">Quelque chose s'est mal passé. Veuillez rafraîchir la page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Rafraîchir
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
