import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { LoginPage } from './LoginPage';
import { AppLoader } from '../components/AppLoader';

export function ProtectedApp({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!session) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
