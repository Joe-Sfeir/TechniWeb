import { Navigate } from "react-router-dom";
import { getToken, getRole, isTokenValid, clearAuth } from "../lib/auth";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  if (!isTokenValid()) { clearAuth(); return <Navigate to="/login" replace />; }
  if (allowedRoles) {
    const role = getRole();
    if (!role || !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
