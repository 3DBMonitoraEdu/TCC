import { api } from "./client.js";
import { Room, Agent } from "../types/index.ts";

export async function getRooms(): Promise<Room[]> {
  const res = await api.get("/rooms");
  console.log(res);
  if (!res.ok) throw new Error("erro ao buscar salas");
  return res.json();
}

export async function createRoom(name: string): Promise<Room> {
  const res = await api.post("/rooms", { name });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "erro ao criar sala");
  }
  return res.json();
}

export async function deleteRoom(roomId: number): Promise<void> {
  const res = await api.delete(`/rooms/${roomId}`);
  if (!res.ok) throw new Error("erro ao deletar sala");
}

export async function getRoomAgents(roomId: number): Promise<{ room: Room; agents: Agent[] }> {
  const res = await api.get(`/rooms/${roomId}/agents`);
  if (!res.ok) throw new Error("erro ao buscar agentes da sala");
  return res.json();
}
