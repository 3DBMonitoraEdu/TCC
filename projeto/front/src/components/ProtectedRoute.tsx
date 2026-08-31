import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import NotFound from "@/pages/NotFound";



export function ProtectedRoute({ children }) {
  const { data, isPending } = authClient.useSession();
  const location = useLocation();


  if (isPending) {
    return <main className="flex min-h-screen items-center justify-center bg-[#070914] text-sm text-slate-400">
        {data ? "Entrando ..." : "Verificando sua sessão..."}
      </main>
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  const role = data.user?.role;

  if (location.pathname === "/dashboard" && role === "admin") {
    return <Navigate to="/admin" replace />
  }

  if (location.pathname === "/admin") {
    if (role === "admin") return children;

    return <NotFound/>;
  }

  return children;
}
