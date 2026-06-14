import crypto from "crypto";
import db from "../db/index.js";
import { RoomNotFoundError } from "./agents.js";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateJoinCode() {
  let code = "";

  for (let i = 0; i < 8; i++) {
    if (i == 4) code += "-";
    const idx = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}

export function createRoom({ schoolId, teacherId, name }) {
  const joinCode = generateJoinCode();

  const stmt = db.prepare(`
    INSERT INTO rooms (school_id, teacher_id, name, join_code)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(schoolId, teacherId, name, joinCode);

  return {
    id: result.lastInsertRowid,
    schoolId,
    teacherId,
    name,
    joinCode,
  };
}

export function getRoomAgents(roomId) {
  const room = db.prepare(`SELECT id, name FROM rooms WHERE id = ?`).get(roomId);

  if (!room) {
    throw new RoomNotFoundError(`Sala não encontrada ${roomId}`);
  }

  const agents = db
    .prepare(`
    SELECT
      a.id,
      a.agent_uuid,
      a.hostname,
      a.last_seen_at,
      m.cpu_percent,
      m.mem_percent,
      m.mem_used_mb,
      m.mem_total_mb,
      m.disk_percent,
      m.disk_used_gb,
      m.disk_total_gb,
      m.collected_at
    FROM agents a
    LEFT JOIN metrics m ON m.id = (
      SELECT id FROM metrics
      WHERE agent_id = a.id
      ORDER BY collected_at DESC
      LIMIT 1
    )
    WHERE a.room_id = ?
    ORDER BY a.hostname
  `)
    .all(roomId);

  return { room, agents };
}
