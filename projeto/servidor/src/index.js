import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import db from "./db/index.js";
import roomsRouter from "./routes/rooms.js";
import agentsRouter from "./routes/agents.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middlewares/auth.js";

const app = express();
const PORT = process.env.PORT || 4040;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());


app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/auth", authRouter);
app.use("/agents", agentsRouter);

app.use(requireAuth); // as rotas a baixo irão passar pelo middleware requireAuth

app.use("/rooms", roomsRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`http://127.0.0.1:${PORT}`);
});
