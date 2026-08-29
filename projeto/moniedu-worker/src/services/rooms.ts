import { env } from "cloudflare:workers";
import { parseProcesses } from "./processes";


const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789";

function generateJoinCode() {
	let code = "";

	for(let i = 0; i < 8; i++){
		if ( i == 4 ) code += '-';
		const idx = crypto.getRandomValues(new Uint32Array(1))[0] % ALPHABET.length;
		code += ALPHABET[idx];
	}

	return code.toLowerCase();
}

async function createRoom(schoolId: string, userId: string, name: string){
	const joinCode = generateJoinCode();

	const room = await env.moniedu.prepare(`
		INSERT INTO rooms (school_id, teacher_id, name, join_code)
		VALUES (?, ?, ?, ?)
	`).bind(schoolId, userId, name, joinCode).run();

	return {
		id: room.meta.last_row_id,
		schoolId,
		userId,
		name,
		joinCode,
		error: false
	}
}

async function getRoomAgents(roomId: string, userId: string) {
	const room = await env.moniedu.prepare(`
		SELECT id, name FROM rooms WHERE id = ? AND teacher_id = ?
	`).bind(roomId, userId).run();

	if (room.results.length == 0) return { error: true, message: "Sala não encontrada ou sem permissão" };

	const agents = await env.moniedu.prepare(`
		SELECT
      a.id,
      a.agent_uuid,
      a.hostname,
      COALESCE(m.collected_at, a.last_seen_at) AS last_seen_at,
      m.cpu_percent,
      m.mem_percent,
      m.mem_used_mb,
      m.mem_total_mb,
      m.disk_percent,
      m.disk_used_gb,
      m.disk_total_gb,
      m.collected_at,
      m.processes_json

    FROM agents a
	    LEFT JOIN metrics m ON m.agent_id = a.id
    WHERE a.room_id = ?
    ORDER BY a.hostname
	`).bind(roomId).run();

	const agentsWithLatestProcess = agents.results.map(({ processes_json, ...agent }) => ({
		...agent,
		last_active_process: parseProcesses(processes_json)[0]?.name ?? null,
	}));

	return { room: room.results[0], agents: agentsWithLatestProcess, error: false };
}

async function getRoomsByTeacher(teacherId: string) {
	const rooms = await env.moniedu.prepare(`
		SELECT id, name, join_code, school_id, teacher_id, created_at
    FROM rooms
    WHERE teacher_id = ?
    ORDER BY created_at DESC
	`).bind(teacherId).run();

	return { rooms: rooms.results, error: false }
}

async function deleteRoom(roomId: string, teacherId: string) {
	const room = await env.moniedu.prepare(`
		SELECT id, teacher_id FROM rooms WHERE id = ?
	`).bind(roomId).run();

	if (room.results.length == 0) return { error: true, message: "Sala não encontrada" };
	if (room.results[0].teacher_id !== teacherId) return { error: true, message: "sem permissão" };

	await env.moniedu.prepare(`DELETE FROM rooms WHERE id = ?`).bind(roomId).run();

	return { error: false, message: "deletado com sucesso" };
}


export {
	createRoom,
	getRoomAgents,
	getRoomsByTeacher,
	deleteRoom
};
