import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-md text-center">
            <h1 className="text-lg font-bold text-gray-800 mb-2">
              Ilovani yuklashda xatolik yuz berdi
            </h1>
            <p className="text-sm text-gray-600">
              Ma'lumotlar formatini tekshiring yoki sahifani qayta yuklang.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
