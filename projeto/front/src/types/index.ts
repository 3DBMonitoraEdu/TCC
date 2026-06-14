export interface Room {
  id: number;
  name: string;
  join_code: string;
  school_id: number;
  teacher_id: number;
  created_at: string;
}

export interface Agent {
  id: number;
  agent_uuid: string;
  hostname: string;
  last_seen_at: string | null;
  room_id: number;
  // campos da ultima metrica (podem ser null se agente nunca enviou dados)
  cpu_percent: number | null;
  mem_percent: number | null;
  mem_used_mb: number | null;
  mem_total_mb: number | null;
  disk_percent: number | null;
  disk_used_gb: number | null;
  disk_total_gb: number | null;
  collected_at: string | null;
}

export interface Process {
  id: number;
  name: string;
  pid: number | null;
  mem_mb: number | null;
}

export type AgentStatus = "online" | "offline" | "warning";

// Determina status do agente baseado no last_seen_at e metricas.
export function getAgentStatus(agent: Agent): AgentStatus {
  if (!agent.last_seen_at) return "offline";

  const lastSeen = new Date(agent.last_seen_at).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastSeen) / 1000 / 60;

  if (diffMinutes > 2) return "offline";
  if ((agent.cpu_percent ?? 0) > 80 || (agent.mem_percent ?? 0) > 85) return "warning";
  return "online";
}
