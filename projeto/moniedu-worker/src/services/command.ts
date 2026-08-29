import { env } from "cloudflare:workers";

async function CreateCommand(agentUuid: string, command: string) {
	await env.moniedu.prepare(`
		INSERT OR REPLACE INTO command (agent_uuid, command, status) VALUES (?, ?, 1)
	`).bind(agentUuid, command).run();
	console.log(`comando criado/atualizado agent_uuid: ${agentUuid} command: ${command}`);
}

async function UpdateCommand(agent_uuid: string){
	const deleted = await env.moniedu.prepare("DELETE FROM command WHERE agent_uuid = ?").bind(agent_uuid).run();
	if (deleted.meta.changes == 0) {
		console.log(`comando não encontrado para deletar, agent_uuid: ${agent_uuid}`);
	}
}

async function returnJsonForAgent(agentUuid: string) {
	const row = await env.moniedu.prepare(`
		SELECT command FROM command WHERE status = 1 AND agent_uuid = ?
	`).bind(agentUuid).run();

	if (row.results.length == 0) return { status: 0, command: 0 };

	return { status: 1, command: row.results[0].command };
}



export {
	CreateCommand,
	UpdateCommand,
	returnJsonForAgent
};

