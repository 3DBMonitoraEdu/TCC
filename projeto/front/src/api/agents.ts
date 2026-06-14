import { api } from "./client.js";
import { Process } from "../types/index.ts";

export async function getAgentProcesses(agentUuid: string): Promise<Process[]> {
  const res = await api.get(`/agents/${agentUuid}/metrics?limit=1`);
  if (!res.ok) throw new Error("erro ao buscar processos");
  const data = await res.json();
  // Retorna os processos da metrica mais recente
  return data.metrics?.[0]?.processes ?? [];
}
