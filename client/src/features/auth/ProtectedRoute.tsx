import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../../components/Spinner';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'checking') {
    return (
      <div className="grid min-h-dvh place-items-center text-slate" role="status">
        <span className="inline-flex items-center gap-2">
          <Spinner /> Checking your session…
        </span>
      </div>
    );
  }

  if (state.status === 'anonymous') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
