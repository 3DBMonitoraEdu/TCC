import { env } from "cloudflare:workers";
import { parseProcesses } from "./processes";



async function registerAgent ( joinCode: string, agentUuid: string, hostname: string )  {

	joinCode = joinCode.toLowerCase();

	const room = await env.moniedu.prepare("SELECT id FROM rooms WHERE join_code = ?").bind(joinCode).run();

	if (!room.results || room.results.length == 0) {
		return { error: true, message: "Não foi encontrada a sala" };
	}

	const agent = await env.moniedu.prepare("SELECT id FROM agents WHERE agent_uuid = ?").bind(agentUuid).run();

	if (agent.results.length > 0) {
		await env.moniedu.prepare("UPDATE agents SET room_id = ?, hostname = ?, last_seen_at = datetime('now') where id = ? ")
				.bind(room.results[0].id).run();
		return { error: false, id: agent.results[0].id, roomId: room.results[0].id, agentUuid, hostname };
	}

	const newAgent = await env.moniedu.prepare("INSERT INTO agents (room_id, agent_uuid, hostname, last_seen_at) VALUES (?, ?, ?, datetime('now'))")
					.bind(room.results[0].id, agentUuid, hostname).run();

	return { error: false, id: newAgent.meta.last_row_id, roomId: room.results[0].id, agentUuid, hostname };
}

async function getAgentMetrics(agentUuid: string, userId: string) {
	const result = await env.moniedu.prepare(`
		SELECT
			a.id AS agent_id,
			a.agent_uuid,
			a.hostname,
			a.room_id,
			COALESCE(m.collected_at, a.last_seen_at) AS last_seen_at,
			m.cpu_percent,
			m.mem_percent,
			m.mem_used_mb,
			m.mem_total_mb,
			m.disk_percent,
			m.disk_used_gb,
			m.disk_total_gb,
			m.processes_json,
			m.collected_at
		FROM agents a
		JOIN rooms r ON r.id = a.room_id
		LEFT JOIN metrics m ON m.agent_id = a.id
		WHERE a.agent_uuid = ? AND r.teacher_id = ?
		LIMIT 1
	`).bind(agentUuid, userId).run();

	if (result.results.length === 0) {
		return { error: true, message: "Agente não encontrado ou sem permissão" };
	}

	const row = result.results[0];
	const agent = {
		id: row.agent_id,
		agent_uuid: row.agent_uuid,
		hostname: row.hostname,
		last_seen_at: row.last_seen_at,
		room_id: row.room_id,
	};

	const metrics = row.collected_at === null ? [] : [{
		cpu_percent: row.cpu_percent,
		mem_percent: row.mem_percent,
		mem_used_mb: row.mem_used_mb,
		mem_total_mb: row.mem_total_mb,
		disk_percent: row.disk_percent,
		disk_used_gb: row.disk_used_gb,
		disk_total_gb: row.disk_total_gb,
		collected_at: row.collected_at,
		processes: parseProcesses(row.processes_json),
	}];

	return { error: false, agent, metrics, total: metrics.length, limit: 1, offset: 0 };
}


export {
	registerAgent,
	getAgentMetrics
};
