import { api } from "./client.js";
import type { Room, Agent } from "../types/index.ts";

interface RoomsResponse {
  rooms?: Room[];
  error?: boolean;
  message?: string;
}

interface CreatedRoomResponse {
  id: number;
  name: string;
  join_code?: string;
  joinCode?: string;
  school_id?: number | string;
  schoolId?: number | string;
  teacher_id?: number | string;
  userId?: number | string;
  created_at?: string;
  error?: boolean;
  message?: string;
}

export async function getRooms(): Promise<Room[]> {
  const res = await api.get("/rooms");
  if (!res.ok) throw new Error("erro ao buscar salas");

  const data = await res.json() as Room[] | RoomsResponse;
  if (Array.isArray(data)) return data;
  if (data.error) throw new Error(data.message || "erro ao buscar salas");
  return data.rooms ?? [];
}

export async function createRoom(name: string): Promise<Room> {
  const res = await api.post("/rooms", { name });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "erro ao criar sala");
  }
  const data = await res.json() as CreatedRoomResponse;

  return {
    id: Number(data.id),
    name: data.name,
    join_code: data.join_code ?? data.joinCode ?? "",
    school_id: data.school_id ?? data.schoolId ?? "",
    teacher_id: data.teacher_id ?? data.userId ?? "",
    created_at: data.created_at ?? new Date().toISOString(),
  };
}

export async function deleteRoom(roomId: number): Promise<void> {
  const res = await api.delete(`/rooms/${roomId}`);
  if (!res.ok) throw new Error("erro ao deletar sala");
}

export async function getRoomAgents(roomId: number): Promise<{ room: Pick<Room, "id" | "name">; agents: Agent[] }> {
  const res = await api.get(`/rooms/${roomId}/agents`);
  if (!res.ok) throw new Error("erro ao buscar agentes da sala");
  return res.json();
}
