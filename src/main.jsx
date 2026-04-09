import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthProvider, { useAuth } from './components/AuthProvider.jsx';
import AuthPage from './components/AuthPage.jsx';

function AuthGate() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('tracer-dark-mode');
    const isDark = stored !== null ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </StrictMode>,
);
