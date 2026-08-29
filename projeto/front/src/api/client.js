const BASE_URL = "https://moniedu-worker.auth-store.workers.dev";



// Faz uma requisição autenticada usando o cookie de sessão do Better Auth.
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  return response;
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
