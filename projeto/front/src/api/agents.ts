import { api } from "./client.js";
import { Process, sortProcessesCustom } from "../types/index.ts";

export async function getAgentProcesses(agentUuid: string): Promise<Process[]> {
  const res = await api.get(`/agent/${agentUuid}/metrics?limit=1`);
  if (!res.ok) throw new Error("erro ao buscar processos");
  const data = await res.json();

  // Retorna o processo mais recente no topo e o restante ordenado por uso de RAM (mem_mb) em ordem decrescente.
  return sortProcessesCustom(data.metrics?.[0]?.processes ?? []);
}

export async function sendAgentCommand(agentUuid: string, command: string): Promise<void> {
  const res = await api.post("/command/createcommand", {
    agent_uuid: agentUuid,
    command,
  });

  if (!res.ok) {
    throw new Error("erro ao enviar comando para o agente");
  }
}
