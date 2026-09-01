import { SELF, env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { getAgentMetrics } from "../src/services/agents";
import { getRoomAgents } from "../src/services/rooms";
import { createSchool } from "../src/services/schools";

describe("authentication", () => {
	it("creates a user through the email signup route", async () => {
		const response = await SELF.fetch(
			"http://localhost/api/auth/sign-up/email",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"CF-Connecting-IP": "203.0.113.10",
					Origin: "http://localhost:3000",
				},
				body: JSON.stringify({
					name: "Test User",
					email: "test@example.com",
					password: "StrongPass123!",
				}),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			user: {
				name: "Test User",
				email: "test@example.com",
			},
		});
	});
});

describe("CSRF protection", () => {
	it("rejects untrusted and missing origins before authentication", async () => {
		const request = (origin?: string) => SELF.fetch("http://localhost/rooms", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(origin ? { Origin: origin } : {}),
			},
			body: JSON.stringify({ name: "Room" }),
		});

		const [untrusted, missing, trusted] = await Promise.all([
			request("https://evil.example"),
			request(),
			request("http://localhost:3000"),
		]);

		expect(untrusted.status).toBe(403);
		expect(missing.status).toBe(403);
		expect(trusted.status).toBe(401);
	});

	it("requires JSON for authenticated mutation routes", async () => {
		const response = await SELF.fetch("http://localhost/command/createcommand", {
			method: "POST",
			headers: {
				"Content-Type": "text/plain",
				Origin: "http://localhost:3000",
			},
			body: JSON.stringify({ agent_uuid: "agent-1", command: "lock" }),
		});

		expect(response.status).toBe(415);
	});
});

describe("agent metrics", () => {
	it("keeps only the latest metric and stores processes as JSON", async () => {
		await env.moniedu.batch([
			env.moniedu.prepare("INSERT INTO schools (id, name) VALUES (?, ?)").bind(1, "Test School"),
			env.moniedu.prepare(`
				INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, schoolId, role)
				VALUES (?, ?, ?, 1, datetime('now'), datetime('now'), ?, 'user')
			`).bind("teacher-1", "Teacher", "teacher@example.com", 1),
			env.moniedu.prepare(`
				INSERT INTO rooms (id, school_id, teacher_id, name, join_code)
				VALUES (?, ?, ?, ?, ?)
			`).bind(1, 1, "teacher-1", "Room", "test-code"),
			env.moniedu.prepare(`
				INSERT INTO agents (id, room_id, agent_uuid, hostname)
				VALUES (?, ?, ?, ?)
			`).bind(1, 1, "agent-1", "host-1"),
		]);

		const firstResponse = await SELF.fetch("http://localhost/agent/agent-1/metrics", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cpuPercent: 10,
				memPercent: 20,
				memUsedMb: 100,
				memTotalMb: 500,
				diskPercent: 30,
				diskUsedGb: 10,
				diskTotalGb: 100,
				processes: [{
					name: "old-process",
					pid: 10,
					memMb: 50,
					createdAt: "2026-08-29T10:00:00.000Z",
				}],
			}),
		});

		expect(firstResponse.status).toBe(200);

		const secondResponse = await SELF.fetch("http://localhost/agent/agent-1/metrics", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cpuPercent: 40,
				memPercent: 50,
				memUsedMb: 250,
				memTotalMb: 500,
				diskPercent: 60,
				diskUsedGb: 20,
				diskTotalGb: 100,
				processes: [
					{
						name: "older",
						pid: 11,
						memMb: 100,
						createdAt: "2026-08-29T10:58:00.000Z",
					},
					{
						name: "newest",
						pid: 12,
						memMb: 200,
						createdAt: "2026-08-29T10:59:00.000Z",
					},
				],
			}),
		});

		expect(secondResponse.status).toBe(200);

		const stored = await env.moniedu.prepare(`
			SELECT cpu_percent, processes_json
			FROM metrics
			WHERE agent_id = ?
		`).bind(1).run<{ cpu_percent: number; processes_json: string }>();
		const count = await env.moniedu.prepare(
			"SELECT COUNT(*) AS count FROM metrics WHERE agent_id = ?",
		).bind(1).first<number>("count");

		expect(count).toBe(1);
		expect(stored.results[0].cpu_percent).toBe(40);
		expect(JSON.parse(stored.results[0].processes_json)).toEqual([
			{
				name: "newest",
				pid: 12,
				mem_mb: 200,
				created_at: "2026-08-29T10:59:00.000Z",
			},
			{
				name: "older",
				pid: 11,
				mem_mb: 100,
				created_at: "2026-08-29T10:58:00.000Z",
			},
		]);

		const detail = await getAgentMetrics("agent-1", "teacher-1");
		expect(detail.error).toBe(false);
		expect(detail.metrics?.[0]?.processes?.[0]?.name).toBe("newest");

		const room = await getRoomAgents("1", "teacher-1");
		expect(room.error).toBe(false);
		expect(room.agents?.[0]?.last_active_process).toBe("newest");
	});
});

describe("schools", () => {
	it("creates a school and rejects a duplicate name", async () => {
		const created = await createSchool("Unique School");
		const duplicate = await createSchool("Unique School");

		expect(created).toMatchObject({
			error: false,
			school: {
				name: "Unique School",
			},
		});
		expect(created.school?.id).toBeTypeOf("number");
		expect(duplicate).toEqual({
			error: true,
			message: "Já existe essa escola",
		});
	});
});
