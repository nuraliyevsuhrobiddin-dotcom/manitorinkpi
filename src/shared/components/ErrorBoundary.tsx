import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application render error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Ilovani yuklashda xatolik yuz berdi
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {this.state.error?.message || "Kutilmagan xatolik"}
            </p>
            {this.state.error?.stack && (
              <pre className="text-[11px] text-left bg-slate-100 dark:bg-slate-900 p-3 rounded-xl overflow-x-auto text-red-700 dark:text-red-400 max-h-48 mb-4 font-mono">
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={() => {
                window.location.hash = '#/dashboard';
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              Sahifani qayta yuklash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
