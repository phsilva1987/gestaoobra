import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { LoginPage } from './LoginPage';

export function ProtectedApp({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">GR</div>
            <h1>Gestão da Reforma</h1>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
