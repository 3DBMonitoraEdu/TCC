import { env } from "cloudflare:workers";
import { AgentPayload, AgentProcesses } from "../types/app";
import type { StoredProcess } from "./processes";

const MAX_PROCESSES = 50;
const MAX_PROCESSES_JSON_BYTES = 64 * 1024;

function processTimestamp(process: AgentProcesses) {
	if (!process.createdAt) return Number.NEGATIVE_INFINITY;
	const timestamp = Date.parse(process.createdAt);
	return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function serializeProcesses(processes: AgentProcesses[]): string {
	const normalized: StoredProcess[] = processes
		.filter((process) =>
			Number.isFinite(process.pid) &&
			Number.isFinite(process.memMb) &&
			typeof process.name === "string" &&
			process.name.length > 0 &&
			process.name.length <= 255
		)
		.sort((left, right) => {
			const byCreation = processTimestamp(right) - processTimestamp(left);
			return byCreation || right.memMb - left.memMb;
		})
		.slice(0, MAX_PROCESSES)
		.map((process) => ({
			name: process.name,
			pid: process.pid,
			mem_mb: process.memMb,
			created_at: process.createdAt,
		}));

	const json = JSON.stringify(normalized);
	if (new TextEncoder().encode(json).byteLength > MAX_PROCESSES_JSON_BYTES) {
		throw new Error("A lista de processos excede 64 KB");
	}

	return json;
}

async function recordMetrics(agentUuid: string, payload: AgentPayload) {
	let processesJson: string;
	try {
		processesJson = serializeProcesses(payload.processes);
	} catch (error) {
		return {
			error: true,
			status: 400,
			message: error instanceof Error ? error.message : "Processos inválidos",
		};
	}

	const result = await env.moniedu.prepare(`
		INSERT INTO metrics (
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
		SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
		FROM agents
		WHERE agent_uuid = ?
		ON CONFLICT(agent_id) DO UPDATE SET
			cpu_percent = excluded.cpu_percent,
			mem_percent = excluded.mem_percent,
			mem_used_mb = excluded.mem_used_mb,
			mem_total_mb = excluded.mem_total_mb,
			disk_percent = excluded.disk_percent,
			disk_used_gb = excluded.disk_used_gb,
			disk_total_gb = excluded.disk_total_gb,
			processes_json = excluded.processes_json,
			collected_at = excluded.collected_at
		RETURNING agent_id
	`).bind(
		payload.cpuPercent,
		payload.memPercent,
		payload.memUsedMb,
		payload.memTotalMb,
		payload.diskPercent,
		payload.diskUsedGb,
		payload.diskTotalGb,
		processesJson,
		agentUuid
	).run();

	if (result.results.length === 0) {
		return { error: true, status: 404, message: "Agente não encontrado!" };
	}

	return { error: false, agentId: result.results[0].agent_id };
}


export {
	recordMetrics
};
