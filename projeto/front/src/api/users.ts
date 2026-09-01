import { authClient } from "@/lib/auth-client";
import type { UserWithRole } from "better-auth/plugins";

type GetUsersReturn = {
  users: UserWithRole[];
  pages: number;
  total: number;
};

async function getUsers(pageSize: number, page: number): Promise<GetUsersReturn> {
  const { data, error } = await authClient.admin.listUsers({
    query: {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }
  });

  if (error) {
    throw new Error(error.message ?? "Não foi possível carregar os usuários.");
  }

  if (!data) {
    throw new Error("A lista de usuários não foi retornada pelo servidor.");
  }

  const total = data.total;
  const totalPages = Math.ceil(total / pageSize);

  return { users: data.users, pages: totalPages, total };
}

export { getUsers };
