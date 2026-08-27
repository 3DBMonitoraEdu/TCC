import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("authentication", () => {
	it("creates a user through the email signup route", async () => {
		const response = await SELF.fetch(
			"http://localhost/api/auth/sign-up/email",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"CF-Connecting-IP": "203.0.113.10",
					Origin: "http://localhost:3000",
				},
				body: JSON.stringify({
					name: "Test User",
					email: "test@example.com",
					password: "StrongPass123!",
				}),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			user: {
				name: "Test User",
				email: "test@example.com",
			},
		});
	});
});
