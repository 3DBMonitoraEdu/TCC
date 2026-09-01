import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  KeyRound,
  LogOut,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserWithRole } from "better-auth/plugins";

import { createSchool, createUser, listSchools } from "@/api/admin";
import { getUsers } from "@/api/users";
import {
  CreateSchoolDialog,
  CreateUserDialog,
} from "@/components/admin/AdminDialogs";
import {
  AdminFeedback,
  type AdminFeedbackMessage,
} from "@/components/admin/AdminFeedback";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { Schools } from "@/types";

const PAGE_SIZE = 10;

type SessionData = {
  user?: {
    name?: string | null;
    email?: string | null;
  };
} | null;

type StatCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone: "sky" | "indigo" | "emerald";
};

const toneClasses = {
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function StatCard({ label, value, detail, icon: Icon, tone }: StatCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Admin() {
  const navigate = useNavigate();
  const { data } = authClient.useSession();
  const session = data as unknown as SessionData;

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [schools, setSchools] = useState<Schools[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [submitting, setSubmitting] = useState<"user" | "school" | null>(null);

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [userFormError, setUserFormError] = useState("");
  const [schoolFormError, setSchoolFormError] = useState("");
  const [feedback, setFeedback] = useState<AdminFeedbackMessage | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const result = await getUsers(PAGE_SIZE, page);

      if (result.pages > 0 && page > result.pages) {
        setPage(result.pages);
        return;
      }

      setUsers(result.users);
      setPages(result.pages);
      setTotalUsers(result.total);
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        title: "Falha ao carregar usuários",
        message: getErrorMessage(error, "Não foi possível carregar o diretório de usuários."),
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [page]);

  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);

    try {
      const result = await listSchools();
      setSchools([...result].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        title: "Falha ao carregar instituições",
        message: getErrorMessage(error, "Não foi possível carregar as instituições."),
      });
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  const handleUserDialogChange = (open: boolean) => {
    if (submitting === "user") return;
    setShowUserDialog(open);
    if (open) setUserFormError("");
  };

  const handleSchoolDialogChange = (open: boolean) => {
    if (submitting === "school") return;
    setShowSchoolDialog(open);
    if (open) setSchoolFormError("");
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("user");
    setUserFormError("");
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const schoolId = String(formData.get("schoolId") ?? "").trim();

    try {
      if (!schoolId) throw new Error("Selecione uma instituição para o usuário.");

      const createdUser = await createUser(name, email, password, schoolId);
      const newUser = { ...createdUser, schoolId } as UserWithRole;
      form.reset();
      setShowUserDialog(false);

      if (page === 1) {
        setUsers((current) => [newUser, ...current.filter((user) => user.id !== newUser.id)].slice(0, PAGE_SIZE));
      } else {
        setPage(1);
      }

      const nextTotal = totalUsers + 1;
      setTotalUsers(nextTotal);
      setPages(Math.ceil(nextTotal / PAGE_SIZE));
      setFeedback({
        kind: "success",
        title: "Usuário criado",
        message: `${name} já pode acessar a plataforma com as credenciais cadastradas.`,
      });
    } catch (error: unknown) {
      setUserFormError(getErrorMessage(error, "Não foi possível criar o usuário."));
    } finally {
      setSubmitting(null);
    }
  };

  const handleCreateSchool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("school");
    setSchoolFormError("");
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    try {
      const school = await createSchool(name);
      form.reset();
      setSchools((current) => [...current, school].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setShowSchoolDialog(false);
      setFeedback({
        kind: "success",
        title: "Instituição cadastrada",
        message: `${school.name} foi adicionada e já está disponível para novos usuários.`,
      });
    } catch (error: unknown) {
      setSchoolFormError(getErrorMessage(error, "Não foi possível cadastrar a instituição."));
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const result = await authClient.signOut({});
      if (result.error) throw new Error(result.error.message ?? "Não foi possível encerrar a sessão.");
      navigate("/login", { replace: true });
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        title: "Falha ao sair",
        message: getErrorMessage(error, "Não foi possível encerrar a sessão."),
      });
      setLoggingOut(false);
    }
  };

  const adminName = session?.user?.name?.trim() || "Administrador";
  const adminEmail = session?.user?.email ?? undefined;

  return (
    <main className="min-h-screen bg-[#f3f6f8] text-slate-900 lg:flex">
      <AdminSidebar
        adminName={adminName}
        adminEmail={adminEmail}
        loggingOut={loggingOut}
        onCreateSchool={() => setShowSchoolDialog(true)}
        onLogout={() => void handleLogout()}
      />

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between bg-[#071522] px-4 text-white lg:hidden">
          <div className="flex items-center gap-3">
            <img src="/favicon-96.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-sm font-semibold">MoniEdu</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-400">Administração</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            aria-label="Sair da conta"
            className="text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <LogOut />
          </Button>
        </header>

        <div className="relative overflow-hidden border-b border-slate-200/80 bg-white">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                  <ShieldCheck className="h-4 w-4" />
                  Console administrativo
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  Acesso restrito
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Gestão de acessos</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                  Administre contas e instituições em um único ambiente de controle.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSchoolDialog(true)}
                  className="border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Building2 />
                  Nova instituição
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowUserDialog(true)}
                  disabled={loadingSchools}
                  className="bg-sky-600 text-white shadow-md shadow-sky-200 hover:bg-sky-700"
                >
                  <Plus />
                  Novo usuário
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          {feedback && <AdminFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />}

          <section aria-label="Resumo administrativo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Contas cadastradas"
              value={loadingUsers ? "—" : totalUsers}
              detail="Usuários de todos os perfis"
              icon={UsersRound}
              tone="sky"
            />
            <StatCard
              label="Instituições"
              value={loadingSchools ? "—" : schools.length}
              detail="Escolas disponíveis no sistema"
              icon={Building2}
              tone="indigo"
            />
            <StatCard
              label="Controle de acesso"
              value="Restrito"
              detail="Ambiente exclusivo para administradores"
              icon={KeyRound}
              tone="emerald"
            />
          </section>

          <AdminUserTable
            users={users}
            schools={schools}
            loading={loadingUsers}
            page={page}
            pages={pages}
            total={totalUsers}
            onPageChange={setPage}
            onRefresh={() => void loadUsers()}
          />
        </div>
      </div>

      <CreateUserDialog
        open={showUserDialog}
        submitting={submitting === "user"}
        error={userFormError}
        schools={schools}
        onOpenChange={handleUserDialogChange}
        onSubmit={(event) => void handleCreateUser(event)}
      />
      <CreateSchoolDialog
        open={showSchoolDialog}
        submitting={submitting === "school"}
        error={schoolFormError}
        onOpenChange={handleSchoolDialogChange}
        onSubmit={(event) => void handleCreateSchool(event)}
      />
    </main>
  );
}
