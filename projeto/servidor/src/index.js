import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import db from "./db/index.js";
import roomsRouter from "./routes/rooms.js";
import agentsRouter from "./routes/agents.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: "http://localhost:5173",
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

app.use("/rooms", roomsRouter);
app.use("/agents", agentsRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`http://127.0.0.1:${PORT}`);
});
