CREATE TABLE IF NOT EXISTS command (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_uuid TEXT NOT NULL UNIQUE,
    status INTEGER NOT NULL DEFAULT (1), -- 1 = pendente, 0 = executado
    command TEXT NOT NULL,               -- nome do comando a executar
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
