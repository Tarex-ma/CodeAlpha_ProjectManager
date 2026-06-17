import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestRoute
 * Prevents already-authenticated users from viewing login / register.
 * Redirects to "/" if a valid session is active.
 */
export default function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // wait for initial session check

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
