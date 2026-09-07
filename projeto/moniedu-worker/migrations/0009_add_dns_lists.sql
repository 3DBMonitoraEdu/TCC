-- Migration number: 0009 	 2026-09-06T03:58:22.801Z

CREATE TABLE IF NOT EXISTS "dns" (
	"agent_id" INTEGER PRIMARY KEY,
	"blocked_domains" TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(blocked_domains) AND json_type(blocked_domains) = 'array'),
	"allowed_domains" TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(allowed_domains) AND json_type(allowed_domains) = 'array'),
	"visited" TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(visited)),
	"mode" TEXT NOT NULL DEFAULT 'blocklist' CHECK (mode IN ('blocklist', 'allowlist')),
	"created_at" TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
);





