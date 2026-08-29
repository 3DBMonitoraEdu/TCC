import { Keyboard, Lock, MonitorOff, MousePointer, Unlock } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AgentControlsProps {
  executingCommand: string | null;
  onSendCommand: (command: string) => void;
}

const COMMANDS = {
  lockInput: "command=lock_mouseAndKeyboard",
  unlockInput: "command=unlock_mouseAndKeyboard",
  lockMonitor: "command=lock_monitor",
  unlockMonitor: "command=unlock_monitor",
} as const;

export function AgentControls({ executingCommand, onSendCommand }: AgentControlsProps) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-4">
      <h3 className="flex items-center text-sm font-semibold text-slate-900">
        <Lock className="mr-2 h-4 w-4 text-blue-600" />
        Ações de controle
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Keyboard className="h-3.5 w-3.5" />
            <MousePointer className="h-3.5 w-3.5" />
            Teclado / Mouse
          </span>
          <div className="flex gap-2">
            <Button
              className="flex-1 text-xs"
              variant="destructive"
              size="sm"
              onClick={() => onSendCommand(COMMANDS.lockInput)}
              disabled={executingCommand !== null}
            >
              {executingCommand === COMMANDS.lockInput ? "Enviando..." : "Bloquear"}
            </Button>
            <Button
              className="flex-1 text-xs"
              variant="outline"
              size="sm"
              onClick={() => onSendCommand(COMMANDS.unlockInput)}
              disabled={executingCommand !== null}
            >
              <Unlock />
              {executingCommand === COMMANDS.unlockInput ? "Enviando..." : "Desbloquear"}
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <MonitorOff className="h-3.5 w-3.5" />
            Monitor / Tela
          </span>
          <div className="flex gap-2">
            <Button
              className="flex-1 text-xs"
              variant="destructive"
              size="sm"
              onClick={() => onSendCommand(COMMANDS.lockMonitor)}
              disabled={executingCommand !== null}
            >
              {executingCommand === COMMANDS.lockMonitor ? "Enviando..." : "Apagar tela"}
            </Button>
            <Button
              className="flex-1 text-xs"
              variant="outline"
              size="sm"
              onClick={() => onSendCommand(COMMANDS.unlockMonitor)}
              disabled={executingCommand !== null}
            >
              <Unlock />
              {executingCommand === COMMANDS.unlockMonitor ? "Enviando..." : "Ligar tela"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
