


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
	createdAt: Date;
};

export type CreateCommandBody = {
	agent_uuid: string;
	command: string;
};



