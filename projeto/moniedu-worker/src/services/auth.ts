import { env } from "cloudflare:workers";

async function agentOwnership(agentuuid: string, userId: string) {
	const agent = await env.moniedu.prepare(`
		SELECT r.teacher_id FROM agents a
		JOIN rooms r ON r.id = a.room_id
		WHERE a.agent_uuid = ?
	`).bind(agentuuid).run();

	if (agent.results.length == 0 || agent.results[0].teacher_id != userId) {
		return { error: true, message: "sem permissão" };
	}

	return { error: false, message: "ok" };

}

async function roomOwnership(roomId: string, userId: string) {
	const room = await env.moniedu.prepare(`
		SELECT teacher_id FROM rooms WHERE id = ?
	`).bind(roomId).run();

	if (room.results.length == 0 || room.results[0].teacher_id != userId) {
		return { error: true, message: "sem permissão" };
	}

	return { error: false, message: "ok" };
}


export {
	agentOwnership,
	roomOwnership
};
