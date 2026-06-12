import express from "express";
import db from "./db/index.js";
import roomsRouter from "./routes/rooms.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/rooms", roomsRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`http://127.0.0.1:${PORT}`);
});
