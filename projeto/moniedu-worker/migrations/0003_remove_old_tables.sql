-- Migration number: 0003 	 2026-08-27T07:30:00.286Z

DROP TABLE IF EXISTS teachers;

DROP TABLE IF EXISTS refresh_tokens;

DROP TABLE IF EXISTS rooms;


PRAGMA foreign_keys = ON;

-- Salas
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);





