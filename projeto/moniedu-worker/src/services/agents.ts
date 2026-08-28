import { env } from "cloudflare:workers";



async function registerAgent ( joinCode: string, agentUuid: string, hostname: string )  {
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

async function getAgentMetrics(agentUuid: string, limit: number = 50, offset: number = 0) {
	const agent = await env.moniedu.prepare(
		`SELECT id, agent_uuid, hostname, last_seen_at, room_id
						FROM agents WHERE agent_uuid = ?`
	).bind(agentUuid).run();

	if (!agent.results || agent.results.length == 0) {
		return { error: true, message: "Agente não encontrado" };
	}

	const metrics = await env.moniedu.prepare(`
		SELECT
      m.id,
      m.cpu_percent,
      m.mem_percent,
      m.mem_used_mb,
      m.mem_total_mb,
      m.disk_percent,
      m.disk_used_gb,
      m.disk_total_gb,
      m.collected_at
    FROM metrics m
    WHERE m.agent_id = ?
    ORDER BY m.collected_at DESC
    LIMIT ? OFFSET ?
	`).bind(agent.results[0].id, limit, offset).run();

	const promisses = metrics.results.map( async (metric) => {
		const processes = await env.moniedu.prepare(`
			SELECT name, pid, mem_mb, created_at FROM processes
			WHERE metric_id = ? ORDER BY mem_mb DESC LIMIT 50
		`).bind(metric.id).run();

		return { ...metric,  processes: processes.results};
	});

	const metricsWithProcesses = await Promise.all(promisses);

	const total = await env.moniedu.prepare("SELECT COUNT(*) as count FROM metrics WHERE agent_id = ?")
								.bind(agent.results[0].id).run();


	return { error: false, agent: agent.results[0], metrics: metricsWithProcesses, total: total.results[0].count, limit, offset };
}


export {
	registerAgent,
	getAgentMetrics
};
