
import type { auth } from "../auth.ts"

type BetterAuthSession = typeof auth.$Infer.Session;


export type AppVariables = {
	user: BetterAuthSession["user"];
	session: BetterAuthSession["session"];
};

export type AgentRegisterJson = {
	joinCode: string;
	agentUuid: string;
	hostname: string;
};

export type AgentPayload = {
	cpuPercent: number;
	memPercent: number;
	memUsedMb: number;
	memTotalMb: number;
	diskPercent: number;
	diskUsedGb: number;
	diskTotalGb: number;
	processes: AgentProcesses[];
};

export type AgentProcesses = {
	pid: number;
	name: string;
	memMb: number;
	createdAt: string | null;
};

export type CreateCommandBody = {
	agent_uuid: string;
	command: string;
};

export type CreateRoomBody = {
	name: string;
}

