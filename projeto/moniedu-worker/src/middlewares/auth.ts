import { createMiddleware } from "hono/factory";
import { AppVariables } from "../types/app";
import { auth } from "../auth";



export const authMiddleware = createMiddleware<{ Variables: AppVariables; }>(
	async (c, next) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) return c.json({ error: true, message: "Não autorizado" }, 401);

		c.set("user", session.user);
		c.set("session", session.session);

		await next();
	}
);



