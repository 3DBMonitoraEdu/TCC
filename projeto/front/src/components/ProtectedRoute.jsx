import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export function ProtectedRoute({ children }) {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return <main className="flex min-h-screen items-center justify-center bg-[#070914] text-sm text-slate-400">
        {data ? "Entrando ..." : "Verificando sua sessão..."}
      </main>
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
