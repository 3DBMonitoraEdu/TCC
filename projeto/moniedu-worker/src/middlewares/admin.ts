import { createMiddleware } from "hono/factory";
import { AppVariables } from "../types/app";




export const adminMiddleware = createMiddleware<{ Variables: AppVariables }>(
	async (c, next) => {

		const user = c.get("user");

		if (user.role != "admin") return c.json({ error: true, message: "n pode man" }, 401);

		await next();
	}
);


