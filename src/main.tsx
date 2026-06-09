import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../extracted_src/src/App';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import '../extracted_src/src/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
