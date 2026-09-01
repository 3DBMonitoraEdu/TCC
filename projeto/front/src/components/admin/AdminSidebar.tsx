import { Building2, LogOut, ShieldCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminSidebarProps = {
  adminName: string;
  adminEmail?: string;
  loggingOut: boolean;
  onCreateSchool: () => void;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}

export function AdminSidebar({
  adminName,
  adminEmail,
  loggingOut,
  onCreateSchool,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-[#071522] text-slate-100 lg:flex">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%)]" />

      <div className="relative flex h-full flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 shadow-[0_0_24px_rgba(14,165,233,0.12)]">
            <img src="/favicon-96.png" alt="" className="h-8 w-8 object-contain" />
          </span>
          <div>
            <p className="font-semibold tracking-tight text-white">MoniEdu</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              Administração
            </p>
          </div>
        </div>

        <nav aria-label="Navegação administrativa" className="flex-1 space-y-7 px-4 py-7">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gestão
            </p>
            <div className="space-y-1">
              <div className="flex h-11 items-center gap-3 rounded-lg bg-sky-500 px-3 text-sm font-medium text-white shadow-lg shadow-sky-950/30">
                <UsersRound className="h-4 w-4" />
                Usuários
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              <button
                type="button"
                onClick={onCreateSchool}
                className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <Building2 className="h-4 w-4" />
                Instituições
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <p className="mt-3 text-xs font-semibold text-white">Ambiente administrativo</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Acesso restrito a contas com privilégio de administrador.
            </p>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-xs font-bold text-sky-300">
              {getInitials(adminName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{adminName}</p>
              <p className="truncate text-[11px] text-slate-500">{adminEmail ?? "Administrador"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={loggingOut}
              onClick={onLogout}
              aria-label="Sair da conta"
              className="h-8 w-8 text-slate-500 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
