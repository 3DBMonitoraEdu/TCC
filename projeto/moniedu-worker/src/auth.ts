import { betterAuth } from "better-auth";
import { env } from "cloudflare:workers";

export const auth = betterAuth({

	database:	env.moniedu,
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [
		"http://localhost:3000",
		"https://monitoraedu.vercel.app"
	],
	emailAndPassword: {
		enabled: true,
	},
	rateLimit: {
		enabled: true,
		storage: "database",
		window: 60,
		max: 100,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "None",
			secure: true,
			httpOnly: true,
		}
	}


});



