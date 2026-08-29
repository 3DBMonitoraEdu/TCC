import { betterAuth } from "better-auth";
import { env } from "cloudflare:workers";
import { TRUSTED_ORIGINS } from "./config/security";

export const auth = betterAuth({

	database:	env.moniedu,
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: TRUSTED_ORIGINS,
	emailAndPassword: {
		enabled: true,
		//disableSignUp: true,
	},
	rateLimit: {
		enabled: true,
		storage: "database",
		window: 60,
		max: 100,
	},
	advanced: {
		ipAddress: {
			ipAddressHeaders: ["cf-connecting-ip"],
		},
		defaultCookieAttributes: {
			sameSite: "None",
			secure: true,
			httpOnly: true,
		}
	},

	user: {
		additionalFields: {
			schoolId: {
				type: "string",
				required: false,
				input: false
			},
			role : {
				type: ["user", "admin"],
				required: false,
				defaultValue: "user",
				input: false
			}
		}
	}
});

