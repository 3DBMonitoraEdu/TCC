-- Escolas
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Professores
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- Salas
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Agentes (computadores)
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  agent_uuid TEXT NOT NULL UNIQUE,
  hostname TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Snapshots de metricas
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  cpu_percent REAL NOT NULL,
  mem_percent REAL NOT NULL,
  mem_used_mb INTEGER NOT NULL,
  mem_total_mb INTEGER NOT NULL,
  disk_percent REAL NOT NULL,
  disk_used_gb REAL NOT NULL,
  disk_total_gb REAL NOT NULL,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Processos por snapshot
CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  pid INTEGER,
  mem_mb REAL,
  FOREIGN KEY (metric_id) REFERENCES metrics(id)
);

-- Indices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_metrics_agent_id ON metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_collected_at ON metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_processes_metric_id ON processes(metric_id);
CREATE INDEX IF NOT EXISTS idx_agents_room_id ON agents(room_id);
