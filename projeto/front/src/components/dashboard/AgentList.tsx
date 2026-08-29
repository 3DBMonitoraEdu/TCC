import { Activity, ChevronRight, Cpu, Database, Monitor, Trash2 } from "lucide-react";

import { AgentStatusBadge } from "@/components/dashboard/AgentStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Agent, Room } from "@/types";
import { getAgentStatus } from "@/types";

interface AgentListProps {
  room: Room;
  agents: Agent[];
  loading: boolean;
  onSelectAgent: (agent: Agent) => void;
  onDeleteRoom: () => void;
}

export function AgentList({
  room,
  agents,
  loading,
  onSelectAgent,
  onDeleteRoom,
}: AgentListProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Computadores em {room.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Código para conexão: {room.join_code}</p>
        </div>

        <Button variant="destructive" size="sm" onClick={onDeleteRoom}>
          <Trash2 />
          Remover Sala
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && agents.length === 0 && (
          <p className="col-span-full py-12 text-center text-slate-500">
            Carregando computadores...
          </p>
        )}

        {!loading && agents.length === 0 && (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white py-12 text-center text-slate-500">
            Nenhum computador registrado nesta sala.
          </div>
        )}

        {agents.map((agent) => {
          const status = getAgentStatus(agent);

          return (
            <Card
              key={agent.agent_uuid}
              className="cursor-pointer border-slate-200 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => onSelectAgent(agent)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Monitor className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {agent.hostname}
                    </CardTitle>
                    <AgentStatusBadge status={status} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <ResourceRow label="CPU" value={agent.cpu_percent} icon="cpu" />
                <ResourceRow label="RAM" value={agent.mem_percent} icon="memory" />

                <div className="flex justify-between pt-1 text-xs text-slate-600">
                  <span className="flex items-center text-slate-500">
                    <Activity className="mr-1 h-3 w-3 text-slate-400" />
                    Último processo
                  </span>
                  <span
                    className="max-w-[160px] truncate font-medium text-slate-700"
                    title={agent.last_active_process ?? "Nenhum"}
                  >
                    {agent.last_active_process ?? "—"}
                  </span>
                </div>

                <div className="flex items-center border-t border-slate-100 pt-2 text-sm font-medium text-blue-600">
                  Ver agente
                  <ChevronRight className="ml-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

interface ResourceRowProps {
  label: string;
  value: number | null;
  icon: "cpu" | "memory";
}

function ResourceRow({ label, value, icon }: ResourceRowProps) {
  const Icon = icon === "cpu" ? Cpu : Database;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span className="flex items-center">
          <Icon className="mr-1 h-3 w-3" />
          {label}
        </span>
        <span>{value?.toFixed(1) ?? "—"}%</span>
      </div>
      <Progress value={value ?? 0} className="h-1.5" />
    </div>
  );
}
