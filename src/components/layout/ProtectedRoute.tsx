import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { Loading } from '@/src/components/ui/Loading';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export function ProtectedRoute({ adminOnly = false, children }: ProtectedRouteProps & { children?: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (adminOnly && (!user || !isAdmin)) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
