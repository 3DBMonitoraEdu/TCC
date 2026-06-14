import { verifyAccessToken } from "../utils/tokens";

export function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "token ausente" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.teacher = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "token invalido ou expirado" });
  }
}
