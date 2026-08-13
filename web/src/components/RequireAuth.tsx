import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

/** Gates pages that need a real account (Orders, Rewards, Settings, ...) —
 * unlike Cart/Checkout, guest sessions can't reach these since there's no
 * account for them to belong to. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
