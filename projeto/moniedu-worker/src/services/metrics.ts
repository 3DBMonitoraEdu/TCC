import { env } from "cloudflare:workers";
import { AgentPayload } from "../types/app";



async function recordMetrics(agentUuid: string, payload: AgentPayload) {
	const agent = await env.moniedu.prepare("SELECT id FROM agents WHERE agent_uuid = ?").bind(agentUuid).run();

	if (!agent.results || agent.results.length == 0) {
		return { error: true, message: "Agente não encontrado!" };
	}

	const insertMetrics = env.moniedu.prepare(`
		INSERT INTO metrics ( agent_id, cpu_percent, mem_percent, mem_used_mb, mem_total_mb, disk_percent, disk_used_gb, disk_total_gb )
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )
	`);

	const insertProcesses = env.moniedu.prepare(`
		INSERT INTO processes ( metric_id, name, pid, mem_mb, created_at )
    VALUES ( ?, ?, ?, ?, COALESCE(?, datetime('now')) )
	`);

	const updateLastSeen = env.moniedu.prepare(`
		UPDATE agents SET last_seen_at = datetime('now') WHERE id = ?
	`);

	const resultMetrics = await insertMetrics.bind(
		agent.results[0].id,
		payload.cpuPercent,
		payload.memPercent,
		payload.memUsedMb,
		payload.memTotalMb,
		payload.diskPercent,
		payload.diskUsedGb,
		payload.diskTotalGb
	).run();

	const metricId = resultMetrics.meta.last_row_id;

	const processesToInsert = payload.processes.map((proc) => {
		return insertProcesses.bind(metricId, proc.name, proc.pid, proc.memMb, proc.createdAt);
	});

	await env.moniedu.batch([
		...processesToInsert,
		updateLastSeen.bind(agent.results[0].id)
	]);

	return { error: false, metricId, agentId: agent.results[0].id };
}


export {
	recordMetrics
};
