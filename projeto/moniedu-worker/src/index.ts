
import { Hono } from "hono";
import { cors } from "hono/cors";

import { auth } from "./auth";


const app = new Hono();

app.use(
	"/api/*",
	cors({
		origin: [
			"http://localhost:3000",
			"https://monitoraedu.vercel.app"
		],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

app.get("/health", (c) => c.json({ 'status': 'Funcionando!' }));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler((c.req.raw)));




export default app;
