import type { LucideIcon } from "lucide-react";
import { Clock, Cpu, Database, HardDrive, Monitor } from "lucide-react";

import { AgentControls } from "@/components/dashboard/AgentControls";
import { AgentStatusBadge } from "@/components/dashboard/AgentStatusBadge";
import { ProcessList } from "@/components/dashboard/ProcessList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Agent, Process } from "@/types";
import { getAgentStatus } from "@/types";

interface AgentDetailsProps {
  agent: Agent;
  processes: Process[];
  loadingProcesses: boolean;
  executingCommand: string | null;
  onRefreshProcesses: () => void;
  onSendCommand: (command: string) => void;
}

export function AgentDetails({
  agent,
  processes,
  loadingProcesses,
  executingCommand,
  onRefreshProcesses,
  onSendCommand,
}: AgentDetailsProps) {
  const status = getAgentStatus(agent);

  return (
    <Card className="mx-auto max-w-4xl border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-blue-50 p-3">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">{agent.hostname}</CardTitle>
            <AgentStatusBadge status={status} size="md" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ResourceMetric label="CPU" icon={Cpu} value={agent.cpu_percent} />
          <ResourceMetric label="RAM" icon={Database} value={agent.mem_percent} />
          <ResourceMetric label="Disco" icon={HardDrive} value={agent.disk_percent} />
        </div>

        <ProcessList
          processes={processes}
          loading={loadingProcesses}
          executingCommand={executingCommand}
          onRefresh={onRefreshProcesses}
          onKillProcess={(pid) => onSendCommand(`command=kill_pid&pid=${pid}`)}
        />

        <div className="flex items-center gap-1 pt-2 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          Última atualização:{" "}
          {agent.collected_at
            ? new Date(agent.collected_at).toLocaleString("pt-BR")
            : "nunca"}
        </div>

        <AgentControls executingCommand={executingCommand} onSendCommand={onSendCommand} />
      </CardContent>
    </Card>
  );
}

interface ResourceMetricProps {
  label: string;
  icon: LucideIcon;
  value: number | null;
}

function ResourceMetric({ label, icon: Icon, value }: ResourceMetricProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-slate-600">
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </div>
        <span className="font-medium text-slate-900">{value?.toFixed(1) ?? "—"}%</span>
      </div>
      <Progress value={value ?? 0} className="h-2" />
    </div>
  );
}
