import { Hono } from "hono"
import { AppVariables, CreateCommandBody } from "../types/app";
import { CreateCommand } from "../services/command";
import { agentOwnership } from "../services/auth";

const cmd = new Hono<{ Variables: AppVariables }>();


cmd.post("/createcommand", async (c) => {
	const { agent_uuid, command } = await c.req.json() as CreateCommandBody;
	const teacher = c.get("user");

	const result = await agentOwnership(agent_uuid, teacher.id);

	if (result.error) return c.json(result, 401);

	if (!agent_uuid || !command) {
		return c.json({ error: true, message: "sem os campos corretos" }, 400);
	}

	await CreateCommand(agent_uuid, command);

	return c.json({ error: false, message: "command created" }, 200);

});

export default cmd;
