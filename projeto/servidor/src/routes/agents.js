import { Router } from "express";
import { registerAgent, getAgentMetrics, RoomNotFoundError } from "../services/agents.js";
import {
  recordMetrics,
  AgentNotFoundError as MetricsAgentNotFoundError,
} from "../services/metrics.js";
import { requireAuth } from "../middlewares/auth.js";

import { returnJsonForAgent, UpdateCommand } from "../services/command.js"

const router = Router();

router.post("/register", (req, res) => {
  const { joinCode, agentUuid, hostname } = req.body;

  if (!joinCode || !agentUuid) {
    return res.status(400).json({ error: "joinCode e agentUuid são obrigatórios" });
  }

  try {
    const agent = registerAgent({ joinCode, agentUuid, hostname });
    res.status(200).json(agent);
  } catch (err) {
    if (err instanceof RoomNotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    console.error("[agents] erro ao registrar agente: ", err);
    res.status(500).json({ error: "erro interno ao registrar agente" });
  }
});

router.post("/:agentUuid/metrics", (req, res) => {
  const { agentUuid } = req.params;
  const payload = req.body;

  const requiredFields = [
    "cpuPercent",
    "memPercent",
    "memUsedMb",
    "memTotalMb",
    "diskPercent",
    "diskUsedGb",
    "diskTotalGb",
  ];
  const missing = requiredFields.filter((field) => payload[field] === undefined);

  if (missing.length > 0) {
    return res.status(400).json({ error: `campos obrigatórios faltando: ${missing.join(", ")}` });
  }

  try {
    const result = recordMetrics(agentUuid, payload);
    if(typeof returnJsonForAgent(agentUuid) !== 'undefined'){
      //console.log(returnJsonForAgent()['status'])
      res.status(201).json(returnJsonForAgent(agentUuid));//res
      UpdateCommand(agentUuid)
    }else{
      res.status(201).json({command: 0});//res
    }
  } catch (err) {
    if (err instanceof MetricsAgentNotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    console.error("[agents] erro ao registrar métricas:", err);
    res.status(500).json({ error: "erro interno ao registrar métricas" });
  }
});

router.get("/:agentUuid/metrics", requireAuth, (req, res, next) => {
  const { agentUuid } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  try {
    const data = getAgentMetrics(agentUuid, { limit, offset }, req.teacher.id);
    res.json(data);
  } catch (err) {
    if (err instanceof AgentNotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    console.error("[agents] erro ao buscar métricas:", err);
    res.status(500).json({ error: "erro interno" });
  }
});

export default router;
