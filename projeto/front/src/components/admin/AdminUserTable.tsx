import type { UserWithRole } from "better-auth/plugins";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Schools } from "@/types";

type AdminUser = UserWithRole & {
  schoolId?: string | number | null;
};

type AdminUserTableProps = {
  users: UserWithRole[];
  schools: Schools[];
  loading: boolean;
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "US";
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : dateFormatter.format(date);
}

function getSchoolName(user: AdminUser, schools: Schools[]) {
  if (user.role === "admin") return "Todas as instituições";
  if (user.schoolId == null) return "Não vinculada";

  return schools.find((school) => String(school.id) === String(user.schoolId))?.name ?? "Instituição vinculada";
}

function RoleBadge({ role }: { role?: string | null }) {
  const isAdmin = role === "admin";

  return (
    <Badge
      variant="outline"
      className={
        isAdmin
          ? "gap-1.5 border-violet-200 bg-violet-50 font-medium text-violet-700"
          : "gap-1.5 border-sky-200 bg-sky-50 font-medium text-sky-700"
      }
    >
      {isAdmin ? <Shield className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
      {isAdmin ? "Administrador" : "Usuário"}
    </Badge>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index} className="hover:bg-transparent">
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-3 w-24" /></TableCell>
    </TableRow>
  ));
}

export function AdminUserTable({
  users,
  schools,
  loading,
  page,
  pages,
  total,
  onPageChange,
  onRefresh,
}: AdminUserTableProps) {
  const safePages = Math.max(1, pages);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-sky-600" />
            <h2 className="font-semibold tracking-tight text-slate-950">Diretório de usuários</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {total === 1 ? "1 conta cadastrada" : `${total} contas cadastradas`} no ambiente.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={onRefresh}
          className="self-start border-slate-200 text-slate-600 sm:self-auto"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
              <TableHead className="pl-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Usuário</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Perfil</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Instituição</TableHead>
              <TableHead className="pr-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRows />
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-52 text-center">
                  <UserRound className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 font-medium text-slate-700">Nenhum usuário cadastrado</p>
                  <p className="mt-1 text-sm text-slate-500">Use “Novo usuário” para criar a primeira conta.</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((rawUser) => {
                const user = rawUser as AdminUser;
                return (
                  <TableRow key={user.id} className="border-slate-100 hover:bg-sky-50/30">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                          {getInitials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell className="max-w-52 truncate text-sm text-slate-600">{getSchoolName(user, schools)}</TableCell>
                    <TableCell className="pr-6 text-sm text-slate-500">{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-44" /></div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <UserRound className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Nenhum usuário cadastrado</p>
            <p className="mt-1 text-sm text-slate-500">Crie a primeira conta para começar.</p>
          </div>
        ) : (
          users.map((rawUser) => {
            const user = rawUser as AdminUser;
            return (
              <article key={user.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                  <div>
                    <p className="text-slate-400">Instituição</p>
                    <p className="mt-1 truncate font-medium text-slate-600">{getSchoolName(user, schools)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-slate-400"><CalendarDays className="h-3 w-3" /> Cadastro</p>
                    <p className="mt-1 font-medium text-slate-600">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
        <p className="text-xs text-slate-500">
          Página <span className="font-semibold text-slate-700">{page}</span> de {safePages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-9 w-9 bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Próxima página"
            disabled={loading || page >= safePages || pages === 0}
            onClick={() => onPageChange(page + 1)}
            className="h-9 w-9 bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
