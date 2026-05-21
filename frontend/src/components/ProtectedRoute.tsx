import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type Role } from '../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useAuthStore();

  // Regra 1: Autenticação obrigatória
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Regra 2: Autorização baseada em Papéis (RBAC)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}