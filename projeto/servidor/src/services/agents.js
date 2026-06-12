import db from "../db/index.js";

export class RoomNotFoundError extends Error {}

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
