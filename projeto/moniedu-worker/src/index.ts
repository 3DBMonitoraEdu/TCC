
import { Hono } from "hono";
import { cors } from "hono/cors";

import { auth } from "./auth";
import agent from "./routes/agents";
import cmd from "./routes/command";
import rooms from "./routes/rooms";

import { authMiddleware } from "./middlewares/auth";
import { csrfMiddleware } from "./middlewares/csrf";
import { TRUSTED_ORIGINS } from "./config/security";

import type { AppVariables } from "./types/app";


const app = new Hono<{
	Variables: AppVariables
}>();

app.use(
	"*",
	cors({
		origin: TRUSTED_ORIGINS,
		allowMethods: ["GET", "POST", "OPTIONS", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

app.use("/command/*", csrfMiddleware);
app.use("/command/*", authMiddleware);
app.use("/rooms/*", csrfMiddleware);
app.use("/rooms/*", authMiddleware);

app.get("/health", (c) => c.json({ 'status': 'Funcionando!' }));

/*
app.get("/internal/:token", async (c) => {
	const token = c.req.param("token");

	if (token != env.TOKEN_ADMIN) return c.json({ message: 'oi td bem?' }, 401);

	const user = await auth.api.createUser({
		body: {
			email: "admin@admin.com",
			password: env.TOKEN_ADMIN,
			name: "Administrator",
			role: "admin"
		}
	});

	return c.json(user);
});
*/

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler((c.req.raw)));

app.route("/agent", agent);

app.get("/me", authMiddleware, async (c) => {
	const user = c.get("user");
	const session = c.get("session");

	return c.json({
		error: false,
		user: user,
		session: session,
	}, 200);
});




app.route("/command", cmd);
app.route("/rooms", rooms);



export default app;
