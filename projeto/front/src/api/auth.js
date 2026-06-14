import { api, setAccessToken } from "./client.js";

const BASE_URL = "http://localhost:4040";

export async function signup({ name, email, password, schoolName }) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password, schoolName }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "erro ao criar conta");
  }

  setAccessToken(data.accessToken);
  return data.teacher;
}

export async function login({ email, password }) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "erro ao fazer login");
  }

  setAccessToken(data.accessToken);
  return data.teacher;
}

export async function logout() {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  setAccessToken(null);
}
