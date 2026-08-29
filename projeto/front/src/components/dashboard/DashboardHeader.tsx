import { ArrowLeft, LogOut, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onLogout: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  onBack,
  onRefresh,
  refreshing = false,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <img
          src="/favicon-96.png"
          alt="Monitoramento Escolar"
          width={84}
          height={56}
          className="h-14 w-auto object-contain"
        />

        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-slate-600">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            Atualizar
          </Button>
        )}

        <Button variant="outline" onClick={onLogout}>
          <LogOut />
          Sair
        </Button>
      </div>
    </header>
  );
}
