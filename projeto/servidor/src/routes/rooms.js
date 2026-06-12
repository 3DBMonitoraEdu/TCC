import { Router } from "express";
import { createRoom } from "../services/rooms.js";

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

export default router;
