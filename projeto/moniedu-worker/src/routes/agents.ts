import { Hono } from "hono";
import { AgentPayload, AgentRegisterJson } from "../types/app";
import { getAgentMetrics, registerAgent } from "../services/agents";
import { recordMetrics } from "../services/metrics";
import { returnJsonForAgent, UpdateCommand } from "../services/command";

const agent = new Hono();

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

	const result = await recordMetrics(agentUuid, payload);

	if (result.error) return c.json({ error: true, message: result.message ?? "Deu ruim" }, 500);

	const cmd = await returnJsonForAgent(agentUuid);

	if (cmd.command == 1) UpdateCommand(agentUuid);

	return c.json(cmd, 200);
});


agent.get("/:agentUuid/metrics", async (c) => {
	const agentUuid = c.req.param("agentUuid") as string;
	const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
	const offset = Number(c.req.query("offset")) || 0;

	const data = await getAgentMetrics(agentUuid, limit, offset);

	if (data.error) return c.json({ error: true, message: data.message ?? "Putz" }, 500);

	return c.json(data, 200);
});

export default agent;


