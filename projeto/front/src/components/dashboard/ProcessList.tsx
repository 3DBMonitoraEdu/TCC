import { Monitor, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Process } from "@/types";

interface ProcessListProps {
  processes: Process[];
  loading: boolean;
  executingCommand: string | null;
  onRefresh: () => void;
  onKillProcess: (pid: number) => void;
}

export function ProcessList({
  processes,
  loading,
  executingCommand,
  onRefresh,
  onKillProcess,
}: ProcessListProps) {
  return (
    <section className="border-t border-slate-100 pt-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="flex items-center text-sm font-semibold text-slate-900">
          <Monitor className="mr-2 h-4 w-4 text-blue-600" />
          Processos em execução ({processes.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      {loading && processes.length === 0 ? (
        <p className="flex items-center text-sm italic text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          Carregando processos...
        </p>
      ) : processes.length === 0 ? (
        <p className="text-sm italic text-slate-500">Nenhum processo disponível.</p>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {processes.map((process, index) => {
            const active = index === 0;
            const command = `command=kill_pid&pid=${process.pid}`;

            return (
              <li
                key={`${process.pid ?? "unknown"}-${index}`}
                className={`flex flex-col gap-2 rounded-md border p-2 text-sm sm:flex-row sm:items-center sm:justify-between ${
                  active
                    ? "border-blue-200 bg-blue-50 font-medium text-blue-900"
                    : "border-slate-100 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${active ? "animate-pulse bg-blue-600" : "bg-green-500"}`} />
                  <span className="truncate">{process.name}</span>
                  {process.pid != null && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                      PID: {process.pid}
                    </span>
                  )}
                  {active && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      Último ativo
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3">
                  <span className="text-xs text-slate-400">
                    {process.mem_mb != null ? `${process.mem_mb.toFixed(1)} MB` : "—"}
                  </span>
                  {process.pid != null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => onKillProcess(process.pid as number)}
                      disabled={executingCommand !== null}
                    >
                      <XCircle />
                      {executingCommand === command ? "Encerrando..." : "Encerrar"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
