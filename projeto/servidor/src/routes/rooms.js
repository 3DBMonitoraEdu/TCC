import { Router } from "express";
import { createRoom, getRoomAgents } from "../services/rooms.js";
import { RoomNotFoundError } from "../services/agents.js";

const router = Router();

router.post("/", (req, res) => {
  const { schoolId, teacherId, name } = req.body;

  if (!schoolId || !teacherId || !name) {
    return res.status(400).json({ error: "schoolId, teacherId e name são obrigatórios" });
  }

  try {
    const room = createRoom({ schoolId, teacherId, name });
    res.status(201).json(room);
  } catch (err) {
    console.error("[rooms] erro ao criar sala: ", err);
    res.status(500).json({ error: "erro interno ao criar sala" });
  }
});

router.get("/:id/agents", (req, res) => {
  const roomId = Number(req.params.id);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return res.status(400).json({ error: "id da sala inválido" });
  }

  try {
    const data = getRoomAgents(roomId);
    res.json(data);
  } catch (err) {
    if (err instanceof RoomNotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    console.error("[rooms] erro ao buscar agentes: ", err);
    res.status(500).json({ error: "erro interno" });
  }
});

export default router;
