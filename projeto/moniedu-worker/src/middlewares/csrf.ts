import { createMiddleware } from "hono/factory";
import { isTrustedOrigin } from "../config/security";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const JSON_METHODS = new Set(["POST", "PUT", "PATCH"]);

export const csrfMiddleware = createMiddleware(async (c, next) => {
	if (SAFE_METHODS.has(c.req.method)) {
		return next();
	}

	const origin = c.req.header("Origin");
	if (!origin || !isTrustedOrigin(origin)) {
		return c.json({ error: true, message: "Origem não autorizada" }, 403);
	}

	if (JSON_METHODS.has(c.req.method)) {
		const contentType = c.req.header("Content-Type")
			?.split(";", 1)[0]
			.trim()
			.toLowerCase();

		if (contentType !== "application/json") {
			return c.json({
				error: true,
				message: "Content-Type deve ser application/json",
			}, 415);
		}
	}

	await next();
});
