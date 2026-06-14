import { Router } from "express";
import {
  createRoom,
  getRoomAgents,
  getRoomsByTeacher,
  deleteRoom,
  RoomForbiddenError,
} from "../services/rooms.js";
import { RoomNotFoundError } from "../services/agents.js";

const router = Router();

router.post("/", (req, res) => {
  const { name } = req.body;
  const schoolId = req.teacher.schoolId;
  const teacherId = req.teacher.id;

  if (!name) {
    return res.status(400).json({ error: "name é obrigatório" });
  }

  try {
    const room = createRoom({ schoolId, teacherId, name });
    res.status(201).json(room);
  } catch (err) {
    console.error("[rooms] erro ao criar sala: ", err);
    res.status(500).json({ error: "erro interno ao criar sala" });
  }
});

router.get("/", (req, res) => {
  try {
    const rooms = getRoomsByTeacher(req.teacher.id);
    console.log(rooms);
    res.json(rooms);
  } catch (err) {
    console.error("[rooms] erro ao listar salas:", err);
    res.status(500).json({ error: "erro interno" });
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

router.delete("/:id", (req, res) => {
  const roomId = Number(req.params.id);

  try {
    deleteRoom(roomId, req.teacher.id);
    res.json({ message: "sala removida com sucesso" });
  } catch (err) {
    if (err instanceof RoomNotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof RoomForbiddenError) return res.status(403).json({ error: err.message });
    console.error("[rooms] erro ao deletar sala:", err);
    res.status(500).json({ error: "erro interno" });
  }
});

export default router;
