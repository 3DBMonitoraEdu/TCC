import { authClient } from "@/lib/auth-client";
import { UserWithRole } from "better-auth/plugins";

type GetUsersReturn = {
  error?: boolean;
  message?: string;
  users?: UserWithRole[];
  pages?: number;
}

async function getUsers(pageSize: number, page: number): Promise<GetUsersReturn> {
  const { data, error } = await authClient.admin.listUsers({
    query: {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }
  });

  if (error) return { error: true, message: error.message };

  const total = data.total;
  const totalPages = Math.ceil(total / pageSize);
  
  return { users: data.users, pages: totalPages };
}

async function getSchools() {
  
}


export {
  getUsers,
  getSchools
}
