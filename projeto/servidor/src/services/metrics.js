import db from "../db/index.js";

export class AgentNotFoundError extends Error {}

export function recordMetrics(agentUuid, payload) {
  const agent = db.prepare("SELECT id FROM agents WHERE agent_uuid = ?").get(agentUuid);

  if (!agent) {
    throw new AgentNotFoundError("agente não encontrado: ", agentUuid);
  }

  const insertMetric = db.prepare(`
    INSERT INTO metrics ( agent_id, cpu_percent, mem_percent, mem_used_mb, mem_total_mb, disk_percent, disk_used_gb, disk_total_gb )
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )
  `);

  const insertProcess = db.prepare(`
    INSERT INTO processes ( metric_id, name, pid, mem_mb, created_at )
    VALUES ( ?, ?, ?, ?, COALESCE(?, datetime('now')) )
  `);

  const updateLastSeen = db.prepare(`
    UPDATE agents SET last_seen_at = datetime('now') WHERE id = ?
  `);

  const runTransaction = db.transaction(() => {
    const result = insertMetric.run(
      agent.id,
      payload.cpuPercent,
      payload.memPercent,
      payload.memUsedMb,
      payload.memTotalMb,
      payload.diskPercent,
      payload.diskUsedGb,
      payload.diskTotalGb,
    );

    const metricId = result.lastInsertRowid;

    for (const proc of payload.processes ?? []) {
      insertProcess.run(metricId, proc.name, proc.pid ?? null, proc.memMb ?? null, proc.createdAt ?? null);
    }

    updateLastSeen.run(agent.id);

    return metricId;
  });

  const metricId = runTransaction();

  return { metricId, agentId: agent.id };
}
