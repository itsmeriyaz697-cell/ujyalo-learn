import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import './styles/index.css';
import { App } from './App';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { DataProvider } from '@/features/data/DataProvider';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing.');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Progressive Web App: production only, so development is never cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // An unavailable service worker is never fatal; the app still works online.
    });
  });
}
