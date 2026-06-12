import { Router } from "express";
import { registerAgent, RoomNotFoundError } from "../services/agents.js";

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

export default router;
