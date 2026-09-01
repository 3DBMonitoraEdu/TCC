import type { UserWithRole } from "better-auth/plugins";
import { api } from "./client.js";
import { authClient } from "@/lib/auth-client";
import type { Schools } from "@/types/index.js";

type ListSchoolsResponse = {
  error: boolean;
  schools: Schools[];
  message?: string;
}

type CreateSchoolResponse = {
  error: boolean;
  school: Schools;
  message?: string;
};

async function createSchool(name: string): Promise<Schools> {
  const res = await api.post("/schools/create", { name });

  const data = await res.json() as CreateSchoolResponse;

  if (!res.ok || data.error) {
    throw new Error(data.message ?? "Não foi possível criar a escola.");
  }

  return data.school;
}

async function createUser(name: string, email: string, password: string, schoolId: string): Promise<UserWithRole> {
  const { data, error } = await authClient.admin.createUser({
    email: email,
    password: password,
    name: name,
    role: "user",
    data: { schoolId: schoolId }
  });

  if (error) throw new Error(error.message ?? "Não foi possível criar o usuário.");

  if (!data?.user) {
    throw new Error("O usuário não foi retornado pelo servidor.");
  }

  return data.user;
}

async function listSchools(): Promise<Schools[]> {
  const res = await api.get("/schools");

  const data = await res.json() as ListSchoolsResponse;

  if (!res.ok || data.error) {
    throw new Error(data.message ?? "Não foi possível carregar as escolas.");
  }

  return data.schools;
}

export { createSchool, createUser, listSchools };
