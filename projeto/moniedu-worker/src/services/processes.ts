export type StoredProcess = {
	name: string;
	pid: number;
	mem_mb: number;
	created_at: string | null;
};

export function parseProcesses(value: unknown): StoredProcess[] {
	if (typeof value !== "string") return [];

	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter((process): process is StoredProcess =>
			process !== null &&
			typeof process === "object" &&
			typeof process.name === "string" &&
			typeof process.pid === "number" &&
			typeof process.mem_mb === "number" &&
			(process.created_at === null || typeof process.created_at === "string")
		);
	} catch {
		return [];
	}
}
