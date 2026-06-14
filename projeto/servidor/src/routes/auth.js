import { Router } from "express";
import {
  signup,
  login,
  refresh,
  logout,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../services/auth.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
};

router.post("/signup", async (req, res) => {
  const { name, email, password, schoolName } = req.body;

  if (!name || !email || !password || !schoolName) {
    return res.status(400).json({ error: "todos os campos são obrigatórios" });
  }

  try {
    const session = await signup({ name, email, password, schoolName });
    res.cookie("refreshToken", session.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({ accessToken: session.accessToken, teacher: session.teacher });
  } catch (err) {
    if (err instanceof EmailAlreadyExistsError) {
      return res.status(409).json({ error: err.message });
    }
    console.error("[auth] erro no signup:", err);
    res.status(500).json({ error: "erro interno" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email e senha são obrigatórios" });
  }

  try {
    const session = await login({ email, password });
    res.cookie("refreshToken", session.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: session.accessToken, teacher: session.teacher });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: err.message });
    }
    console.error("[auth] erro no login:", err);
    res.status(500).json({ error: "erro interno" });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  try {
    const session = await refresh(refreshToken);
    res.cookie("refreshToken", session.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: session.accessToken });
  } catch (err) {
    if (err instanceof InvalidRefreshTokenError) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: err.message });
    }
    console.error("[auth] erro no refresh:", err);
    res.status(500).json({ error: "erro interno" });
  }
});

router.post("/logout", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  logout(refreshToken);
  res.clearCookie("refreshToken");
  res.json({ message: "logout realizado com sucesso" });
});

export default router;
