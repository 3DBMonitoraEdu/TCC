import { Hono } from "hono"
import { CreateCommandBody } from "../types/app";
import { CreateCommand } from "../services/command";

const cmd = new Hono();

cmd.post("/createcommand", async (c) => {
	const { agent_uuid, command } = await c.req.json() as CreateCommandBody;

	if (!agent_uuid || !command) {
		return c.json({ error: true, message: "sem os campos corretos" }, 400);
	}

	await CreateCommand(agent_uuid, command);

	return c.json({ error: false, message: "command created" }, 200);

});

export default cmd;
