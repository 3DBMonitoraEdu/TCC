import crypto from "crypto";
import db from "../db/index.js";

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
