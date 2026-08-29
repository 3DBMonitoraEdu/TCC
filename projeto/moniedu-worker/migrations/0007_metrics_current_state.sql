-- Metrics now stores only the latest snapshot for each agent.
-- Preserve the newest existing metric and migrate up to 50 processes to JSON.
CREATE TABLE metrics_current (
	agent_id INTEGER PRIMARY KEY,
	cpu_percent REAL NOT NULL,
	mem_percent REAL NOT NULL,
	mem_used_mb INTEGER NOT NULL,
	mem_total_mb INTEGER NOT NULL,
	disk_percent REAL NOT NULL,
	disk_used_gb REAL NOT NULL,
	disk_total_gb REAL NOT NULL,
	processes_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(processes_json)),
	collected_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

INSERT INTO metrics_current (
	agent_id,
	cpu_percent,
	mem_percent,
	mem_used_mb,
	mem_total_mb,
	disk_percent,
	disk_used_gb,
	disk_total_gb,
	processes_json,
	collected_at
)
SELECT
	m.agent_id,
	m.cpu_percent,
	m.mem_percent,
	m.mem_used_mb,
	m.mem_total_mb,
	m.disk_percent,
	m.disk_used_gb,
	m.disk_total_gb,
	COALESCE((
		SELECT json_group_array(json_object(
			'name', recent.name,
			'pid', recent.pid,
			'mem_mb', recent.mem_mb,
			'created_at', recent.created_at
		))
		FROM (
			SELECT p.name, p.pid, p.mem_mb, p.created_at
			FROM processes p
			WHERE p.metric_id = m.id
			ORDER BY
				CASE WHEN p.created_at IS NULL THEN 1 ELSE 0 END,
				p.created_at DESC,
				p.mem_mb DESC
			LIMIT 50
		) recent
	), '[]'),
	m.collected_at
FROM metrics m
JOIN (
	SELECT agent_id, MAX(id) AS latest_id
	FROM metrics
	GROUP BY agent_id
) latest ON latest.latest_id = m.id;

DROP TABLE processes;
DROP TABLE metrics;
ALTER TABLE metrics_current RENAME TO metrics;
