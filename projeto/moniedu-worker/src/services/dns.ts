import { env } from "cloudflare:workers";
import type { AgentDnsPolicy, DnsMode, DnsPolicy } from "../types/app";

const MAX_DOMAINS = 500;
const MAX_DOMAIN_LENGTH = 253;
const MAX_DOMAINS_JSON_BYTES = 64 * 1024;

type StoredDnsPolicy = {
	mode: DnsMode;
	blocked_domains: string;
	allowed_domains: string;
};

function serializeDomains(value: unknown, field: string): string {
	if (!Array.isArray(value)) {
		throw new Error(`${field} deve ser uma lista`);
	}

	const domains = value.map((domain) => {
		if (typeof domain !== "string") {
			throw new Error(`${field} deve conter apenas domínios em texto`);
		}

		const normalized = domain.trim().toLowerCase().replace(/\.+$/, "");
		if (!normalized || normalized.length > MAX_DOMAIN_LENGTH) {
			throw new Error(`domínio inválido em ${field}`);
		}

		return normalized;
	});

	const uniqueDomains = [...new Set(domains)];
	if (uniqueDomains.length > MAX_DOMAINS) {
		throw new Error(`${field} não pode conter mais de ${MAX_DOMAINS} domínios`);
	}

	const json = JSON.stringify(uniqueDomains);
	if (new TextEncoder().encode(json).byteLength > MAX_DOMAINS_JSON_BYTES) {
		throw new Error(`${field} excede 64 KB`);
	}

	return json;
}

function parsePolicyDomains(value: string): string[] {
	const domains: unknown = JSON.parse(value);
	if (!Array.isArray(domains) || domains.some((domain) => typeof domain !== "string")) {
		throw new Error("A política DNS armazenada é inválida");
	}

	return domains;
}

function parseDnsPolicy(policy: StoredDnsPolicy): DnsPolicy {
	if (policy.mode !== "blocklist" && policy.mode !== "allowlist") {
		throw new Error("O modo DNS armazenado é inválido");
	}

	return {
		mode: policy.mode,
		blockedDomains: parsePolicyDomains(policy.blocked_domains),
		allowedDomains: parsePolicyDomains(policy.allowed_domains),
	};
}

async function recordDnsMetrics(agentUuid: string, visited: unknown) {
	let visitedJson: string;
	try {
		visitedJson = serializeDomains(visited, "visited");
	} catch (error) {
		return {
			error: true,
			status: 400,
			message: error instanceof Error ? error.message : "Domínios visitados inválidos",
		};
	}

	const result = await env.moniedu.prepare(`
		INSERT INTO dns (agent_id, visited)
		SELECT id, ?
		FROM agents
		WHERE agent_uuid = ?
		ON CONFLICT(agent_id) DO UPDATE SET visited = excluded.visited
		RETURNING mode, blocked_domains, allowed_domains
	`).bind(visitedJson, agentUuid).run<StoredDnsPolicy>();

	const policy = result.results[0];
	if (!policy) {
		return { error: true, status: 404, message: "Agente não encontrado!" };
	}

	try {
		const dnsPolicy = parseDnsPolicy(policy);
		const domains = dnsPolicy.mode === "blocklist"
			? dnsPolicy.blockedDomains
			: dnsPolicy.allowedDomains;

		const response: AgentDnsPolicy = { mode: dnsPolicy.mode, domains };
		return { error: false, policy: response };
	} catch (error) {
		return {
			error: true,
			status: 500,
			message: error instanceof Error ? error.message : "Política DNS inválida",
		};
	}
}

async function getDnsPolicy(agentUuid: string) {
	const result = await env.moniedu.prepare(`
		SELECT
			COALESCE(d.mode, 'blocklist') AS mode,
			COALESCE(d.blocked_domains, '[]') AS blocked_domains,
			COALESCE(d.allowed_domains, '[]') AS allowed_domains
		FROM agents a
		LEFT JOIN dns d ON d.agent_id = a.id
		WHERE a.agent_uuid = ?
		LIMIT 1
	`).bind(agentUuid).run<StoredDnsPolicy>();

	const policy = result.results[0];
	if (!policy) {
		return { error: true, status: 404, message: "Agente não encontrado!" };
	}

	try {
		return { error: false, policy: parseDnsPolicy(policy) };
	} catch (error) {
		return {
			error: true,
			status: 500,
			message: error instanceof Error ? error.message : "Política DNS inválida",
		};
	}
}

async function updateDnsPolicy(agentUuid: string, value: unknown) {
	if (!value || typeof value !== "object") {
		return { error: true, status: 400, message: "Política DNS inválida" };
	}

	const policy = value as Partial<DnsPolicy>;
	if (policy.mode !== "blocklist" && policy.mode !== "allowlist") {
		return { error: true, status: 400, message: "mode deve ser blocklist ou allowlist" };
	}

	let blockedDomains: string;
	let allowedDomains: string;
	try {
		blockedDomains = serializeDomains(policy.blockedDomains, "blockedDomains");
		allowedDomains = serializeDomains(policy.allowedDomains, "allowedDomains");
	} catch (error) {
		return {
			error: true,
			status: 400,
			message: error instanceof Error ? error.message : "Listas DNS inválidas",
		};
	}

	const result = await env.moniedu.prepare(`
		INSERT INTO dns (agent_id, mode, blocked_domains, allowed_domains)
		SELECT id, ?, ?, ?
		FROM agents
		WHERE agent_uuid = ?
		ON CONFLICT(agent_id) DO UPDATE SET
			mode = excluded.mode,
			blocked_domains = excluded.blocked_domains,
			allowed_domains = excluded.allowed_domains
		RETURNING mode, blocked_domains, allowed_domains
	`).bind(policy.mode, blockedDomains, allowedDomains, agentUuid).run<StoredDnsPolicy>();

	const storedPolicy = result.results[0];
	if (!storedPolicy) {
		return { error: true, status: 404, message: "Agente não encontrado!" };
	}

	try {
		return { error: false, policy: parseDnsPolicy(storedPolicy) };
	} catch (error) {
		return {
			error: true,
			status: 500,
			message: error instanceof Error ? error.message : "Política DNS inválida",
		};
	}
}

export {
	getDnsPolicy,
	recordDnsMetrics,
	updateDnsPolicy,
};
