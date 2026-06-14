import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
