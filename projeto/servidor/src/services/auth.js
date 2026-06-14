import argon2 from "argon2";
import db from "../db/index.js";
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from "../utils/tokens.js";

export class EmailAlreadyExistsError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}

export async function signup({ name, email, password, schoolName }) {
  const existing = db.prepare("SELECT id FROM teachers WHERE email = ?").get(email);
  if (existing) {
    throw new EmailAlreadyExistsError("email já cadastrado");
  }

  const passwordHash = await argon2.hash(password);

  // Cria escola e professor numa transacao.
  const run = db.transaction(() => {
    const school = db.prepare("INSERT INTO schools (name) VALUES (?)").run(schoolName);

    const teacher = db
      .prepare(`
      INSERT INTO teachers (school_id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `)
      .run(school.lastInsertRowid, name, email, passwordHash);

    return {
      id: teacher.lastInsertRowid,
      school_id: school.lastInsertRowid,
      name,
      email,
    };
  });

  const teacher = run();
  return _createSession(teacher);
}

export async function login({ email, password }) {
  const teacher = db
    .prepare(`
    SELECT id, school_id, name, email, password_hash
    FROM teachers WHERE email = ?
  `)
    .get(email);

  if (!teacher) {
    throw new InvalidCredentialsError("email ou senha inválidos");
  }

  const passwordHash = teacher?.password_hash;
  const valid = await argon2.verify(passwordHash, password);

  if (!valid) {
    throw new InvalidCredentialsError("email ou senha inválidos");
  }

  return _createSession(teacher);
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new InvalidRefreshTokenError("refresh token ausente");
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const stored = db
    .prepare(`
    SELECT rt.id, rt.teacher_id, rt.expires_at,
           t.id as id, t.school_id, t.name, t.email
    FROM refresh_tokens rt
    JOIN teachers t ON t.id = rt.teacher_id
    WHERE rt.token_hash = ?
  `)
    .get(tokenHash);

  if (!stored) {
    throw new InvalidRefreshTokenError("refresh token inválido");
  }

  if (new Date(stored.expires_at) < new Date()) {
    db.prepare("DELETE FROM refresh_tokens WHERE id = ?").run(stored.id);
    throw new InvalidRefreshTokenError("refresh token expirado");
  }

  // Rotaciona o refresh token — invalida o antigo, gera um novo.
  const accessToken = generateAccessToken(stored);
  const newRefresh = generateRefreshToken();

  db.transaction(() => {
    db.prepare("DELETE FROM refresh_tokens WHERE id = ?").run(stored.id);
    db.prepare(`
      INSERT INTO refresh_tokens (teacher_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(stored.teacher_id, newRefresh.hash, newRefresh.expiresAt);
  })();

  return { accessToken, refreshToken: newRefresh.token };
}

export function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashRefreshToken(refreshToken);
  db.prepare("DELETE FROM refresh_tokens WHERE token_hash = ?").run(tokenHash);
}

// Funcao interna: cria sessao (access token + refresh token) para um professor.
function _createSession(teacher) {
  const accessToken = generateAccessToken(teacher);
  const refresh = generateRefreshToken();

  db.prepare(`
    INSERT INTO refresh_tokens (teacher_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(teacher.id, refresh.hash, refresh.expiresAt);

  return {
    accessToken,
    refreshToken: refresh.token,
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      schoolId: teacher.school_id,
    },
  };
}
