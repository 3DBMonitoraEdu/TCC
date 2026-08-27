import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://moniedu-worker.auth-store.workers.dev"
});
