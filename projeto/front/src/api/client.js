const BASE_URL = "http://localhost:4040";

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Faz uma requisicao autenticada. Se receber 401, tenta renovar o token e repete.
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    credentials: "include", // necessario para enviar/receber cookies (refresh token)
  });

  // Token expirado — tenta renovar uma vez e repete o request original
  if (response.status === 401) {
    const renewed = await tryRefresh();
    if (!renewed) {
      throw new UnauthorizedError();
    }

    // Repete o request original com o novo token
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
      credentials: "include",
    });
  }

  return response;
}

// Tenta renovar o access token usando o refresh token (cookie httpOnly).
async function tryRefresh() {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      accessToken = null;
      return false;
    }

    const data = await response.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    accessToken = null;
    return false;
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("sessão expirada");
  }
}

// Metodos de conveniencia
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
