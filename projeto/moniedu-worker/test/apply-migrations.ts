import { applyD1Migrations, env } from "cloudflare:test";
import type { D1Migration } from "cloudflare:test";
import { beforeEach } from "vitest";

beforeEach(async () => {
	const migrations = (env as Cloudflare.Env & {
		TEST_MIGRATIONS: D1Migration[];
	}).TEST_MIGRATIONS;

	await applyD1Migrations(env.moniedu, migrations);
});
