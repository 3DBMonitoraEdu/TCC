export interface Room {
  id: number;
  name: string;
  join_code: string;
  school_id: number | string;
  teacher_id: number | string;
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
  last_active_process?: string | null;
}

export interface Process {
  id: number;
  name: string;
  pid: number | null;
  mem_mb: number | null;
  created_at?: string | null;
  createdAt?: string | null;
}

export type AgentStatus = "online" | "offline" | "warning";

export function getProcessCreatedAt(process: Process): number | null {
  const rawValue = process.createdAt ?? process.created_at;
  if (!rawValue) return null;

  const timestamp = new Date(rawValue).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function sortProcessesByCreationDate(processes: Process[]): Process[] {
  return [...processes].sort((a, b) => {
    const aTime = getProcessCreatedAt(a);
    const bTime = getProcessCreatedAt(b);

    if (aTime == null && bTime == null) return 0;
    if (aTime == null) return 1;
    if (bTime == null) return -1;

    return bTime - aTime;
  });
}

export function sortProcessesCustom(processes: Process[]): Process[] {
  if (processes.length <= 1) return processes;

  // Primeiro, ordena por data de criação para identificar o processo mais recente
  const sortedByDate = sortProcessesByCreationDate(processes);
  const mostRecent = sortedByDate[0];
  const rest = sortedByDate.slice(1);

  // Ordena o restante pelo peso de memória RAM (mem_mb) em ordem decrescente
  rest.sort((a, b) => (b.mem_mb ?? 0) - (a.mem_mb ?? 0));

  return [mostRecent, ...rest];
}

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
