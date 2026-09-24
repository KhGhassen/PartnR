import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUrl } from '../lib/redirect';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Without the redirect, a shared link to a protected page ended on the home
  // page after login — the last metre of the whole sharing chain was cut.
  if (!isAuthenticated) return <Navigate to={loginUrl(location.pathname + location.search)} replace />;
  return children;
}
