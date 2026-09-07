import { Hono } from "hono";
import { AgentDnsPayload, AgentPayload, AgentRegisterJson, AppVariables, DnsPolicy } from "../types/app";

import { getAgentMetrics, registerAgent } from "../services/agents";
import { recordMetrics } from "../services/metrics";
import { getDnsPolicy, recordDnsMetrics, updateDnsPolicy } from "../services/dns";
import { returnJsonForAgent, UpdateCommand } from "../services/command";
import { authMiddleware } from "../middlewares/auth";
import { csrfMiddleware } from "../middlewares/csrf";
import { agentOwnership } from "../services/auth";

const agent = new Hono<{ Variables: AppVariables }>();

agent.post("/register", async (c) => {
	const body = await c.req.json() as AgentRegisterJson;

	if (!body.agentUuid || !body.joinCode) {
		return c.json({ error: true, message: "joinCode e agentUuid são obrigatorios!" }, 400);
	}

	const agent = await registerAgent(body.joinCode, body.agentUuid, body.hostname);

	if (agent.error) {
		return c.json({ error: true, message: agent.message ?? "Deu Pau" }, 500);
	}

	return c.json(agent, 200);
});

agent.post("/dns", async (c) => {
	const payload = await c.req.json() as AgentDnsPayload;

	if (typeof payload.agentUuid !== "string" || payload.agentUuid.length === 0) {
		return c.json({ error: true, message: "agentUuid é obrigatório" }, 400);
	}
	if (!Array.isArray(payload.visited)) {
		return c.json({ error: true, message: "visited deve ser uma lista" }, 400);
	}

	const result = await recordDnsMetrics(payload.agentUuid, payload.visited);
	if (result.error) {
		const body = { error: true, message: result.message ?? "Não foi possível sincronizar o DNS" };
		if (result.status === 400) return c.json(body, 400);
		if (result.status === 404) return c.json(body, 404);
		return c.json(body, 500);
	}

	return c.json({ error: false, ...result.policy }, 200);
});

agent.get("/:agentUuid/dns", authMiddleware, async (c) => {
	const agentUuid = c.req.param("agentUuid");
	const teacher = c.get("user");
	const ownership = await agentOwnership(agentUuid, teacher.id);

	if (ownership.error) return c.json(ownership, 403);

	const result = await getDnsPolicy(agentUuid);
	if (result.error) return c.json({ error: true, message: result.message ?? "Não foi possível buscar a política DNS" }, result.status === 404 ? 404 : 500);

	return c.json({ error: false, ...result.policy }, 200);
});

agent.post("/:agentUuid/dns", csrfMiddleware, authMiddleware, async (c) => {
	const agentUuid = c.req.param("agentUuid");
	const teacher = c.get("user");
	const ownership = await agentOwnership(agentUuid, teacher.id);

	if (ownership.error) return c.json(ownership, 403);

	const payload = await c.req.json() as DnsPolicy;
	const result = await updateDnsPolicy(agentUuid, payload);
	if (result.error) {
		const body = { error: true, message: result.message ?? "Não foi possível salvar a política DNS" };
		if (result.status === 400) return c.json(body, 400);
		if (result.status === 404) return c.json(body, 404);
		return c.json(body, 500);
	}

	return c.json({ error: false, ...result.policy }, 200);
});


agent.post("/:agentUuid/metrics", async (c) => {
	const agentUuid = c.req.param("agentUuid") as string;
	const payload = await c.req.json() as AgentPayload;

	const requiredFields = [
    "cpuPercent",
    "memPercent",
    "memUsedMb",
    "memTotalMb",
    "diskPercent",
    "diskUsedGb",
    "diskTotalGb",
	];
	const missing = requiredFields.filter((field: any) => (payload as any)[field] === undefined);

	if(missing.length > 0) return c.json({ error: true, message: `campos obrigatórios faltando: ${missing.join(", ")}`}, 400);
	if (!payload.processes || !Array.isArray(payload.processes)) {
		return c.json({ error: true, message: "processes deve ser uma lista" }, 400);
	}

	const invalidNumbers = requiredFields.filter((field) => !Number.isFinite((payload as any)[field]));
	if (invalidNumbers.length > 0) {
		return c.json({ error: true, message: `campos numéricos inválidos: ${invalidNumbers.join(", ")}` }, 400);
	}

	const result = await recordMetrics(agentUuid, payload);

	if (result.error) {
		const body = { error: true, message: result.message ?? "Deu ruim" };
		if (result.status === 400) return c.json(body, 400);
		if (result.status === 404) return c.json(body, 404);
		return c.json(body, 500);
	}

	const cmd = await returnJsonForAgent(agentUuid);

	if (cmd.status === 1) await UpdateCommand(agentUuid);

	return c.json(cmd, 201);
});


agent.get("/:agentUuid/metrics", authMiddleware, async (c) => {
	const agentUuid = c.req.param("agentUuid") as string;
	const user = c.get("user");

	const data = await getAgentMetrics(agentUuid, user.id);

	if (data.error) return c.json({ error: true, message: data.message ?? "Putz" }, 404);

	return c.json(data, 200);
});

export default agent;
