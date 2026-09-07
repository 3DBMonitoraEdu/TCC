import { api } from "./client.js";
import { Process, sortProcessesCustom } from "../types/index.ts";

export type DnsMode = "blocklist" | "allowlist";

export interface DnsPolicy {
  mode: DnsMode;
  blockedDomains: string[];
  allowedDomains: string[];
}

type DnsPolicyResponse = DnsPolicy & {
  error?: boolean;
  message?: string;
};

async function getResponseError(response: Response, fallback: string): Promise<Error> {
  const data = await response.json().catch(() => null) as { message?: string } | null;
  return new Error(data?.message || fallback);
}

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

export async function getAgentDnsPolicy(agentUuid: string): Promise<DnsPolicy> {
  const res = await api.get(`/agent/${agentUuid}/dns`);
  if (!res.ok) throw await getResponseError(res, "erro ao buscar política DNS");

  const data = await res.json() as DnsPolicyResponse;
  if (data.error) throw new Error(data.message || "erro ao buscar política DNS");

  return {
    mode: data.mode,
    blockedDomains: data.blockedDomains,
    allowedDomains: data.allowedDomains,
  };
}

export async function updateAgentDnsPolicy(agentUuid: string, policy: DnsPolicy): Promise<DnsPolicy> {
  const res = await api.post(`/agent/${agentUuid}/dns`, policy);
  if (!res.ok) throw await getResponseError(res, "erro ao salvar política DNS");

  const data = await res.json() as DnsPolicyResponse;
  if (data.error) throw new Error(data.message || "erro ao salvar política DNS");

  return {
    mode: data.mode,
    blockedDomains: data.blockedDomains,
    allowedDomains: data.allowedDomains,
  };
}
