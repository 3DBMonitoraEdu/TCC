import db from "../db/index.js";

export class RoomNotFoundError extends Error {}
export class AgentNotFoundError extends Error {}

export function registerAgent({ joinCode, agentUuid, hostname }) {
  const room = db.prepare("SELECT id FROM rooms WHERE join_code = ?").get(joinCode);

  if (!room) {
    throw new RoomNotFoundError(`Sala não encontrada para join_code: ${joinCode}`);
  }

  const existing = db.prepare("SELECT id FROM agents WHERE agent_uuid = ?").get(agentUuid);

  if (existing) {
    db.prepare(`
      UPDATE agents SET room_id = ?, hostname = ?, last_seen_at = datetime('now')
      WHERE id = ?
    `).run(room.id, hostname, existing.id);

    return { id: existing.id, roomId: room.id, agentUuid, hostname };
  }

  const result = db
    .prepare(`
    INSERT INTO agents (room_id, agent_uuid, hostname, last_seen_at)
    VALUES (?, ?, ?, datetime('now'))
  `)
    .run(room.id, agentUuid, hostname);

  return { id: result.lastInsertRowid, roomId: room.id, agentUuid, hostname };
}

export function getAgentMetrics(agentUuid, { limit = 50, offset = 0 } = {}) {
  const agent = db
    .prepare(`
    SELECT id, agent_uuid, hostname, last_seen_at, room_id
    FROM agents WHERE agent_uuid = ?
  `)
    .get(agentUuid);

  if (!agent) {
    throw new AgentNotFoundError(`agente não encontrado: ${agentUuid}`);
  }

  const metrics = db
    .prepare(`
    SELECT
      m.id,
      m.cpu_percent,
      m.mem_percent,
      m.mem_used_mb,
      m.mem_total_mb,
      m.disk_percent,
      m.disk_used_gb,
      m.disk_total_gb,
      m.collected_at
    FROM metrics m
    WHERE m.agent_id = ?
    ORDER BY m.collected_at DESC
    LIMIT ? OFFSET ?
  `)
    .all(agent.id, limit, offset);

  const total = db
    .prepare("SELECT COUNT(*) as count FROM metrics WHERE agent_id = ?")
    .get(agent.id).count;

  return { agent, metrics, total, limit, offset };
}
