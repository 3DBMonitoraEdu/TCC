import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserWithRole } from "better-auth/plugins";
import { getUsers } from "@/api/users";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { FormEvent } from "react";
import { Schools } from "@/types";

export default function Admin(){
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [show, setShow] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [schools, setSchools] = useState<Schools[]>([]);
  

  useEffect(() => {

    async function run(){
      const users = await getUsers(10, page);
      setPages(users?.pages ?? 0);
      
      setUsers(users?.users ?? []);
      
    }

    run()

  },[]);


  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  const handleShowModal = (open: boolean) => {
    setShow(open);
  }

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }
  

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <header className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-4">

        <img
          src="/favicon-96.png"
          alt="Monitoramento Escolar"
          width={84}
          height={56}
          className="h-14 w-auto object-domain"
        />

        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Página Admin</h1>
          <p className="mt-1 text-slate-600">Criação de usuarios, por enquanto</p>
        </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">

          <Button variant="destructive" onClick={handleLogout}>
            <LogOut/>
            Sair
          </Button>

        </div>

      </header>

      <section className="flex flex-col p-4">

        <div className="flex h-20 m-5 justify-end">
          <Button onClick={() => handleShowModal(true)}>
            Criar Usuario
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {
          users.map((e: UserWithRole) => (
            <div className="flex flex-col w-auto min-h-20 p-4 border bg-slate-950/10">
              <h1>{e.name}</h1>
              <h1>{e.email}</h1>
              <h1>{e.createdAt.toISOString()}</h1>
            </div>
          ))
        }
        </div>

        <div className="flex items-center gap-4 justify-end">
          <h1> { page } / {pages} </h1>
          <Button variant="outline" onClick={() => setPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>
      </section>

      <Dialog open={show} onOpenChange={handleShowModal}>
        <DialogContent>
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>
                Criar Novo Usuario
              </DialogTitle>
              <DialogDescription>
                Crie um novo usuario
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <Input 
                name="name"
                placeholder="Nome do Usuario"
                required
              />

              <Input
                name="email"
                placeholder="Email do usuario"
                required
              />

              <Input
                name="password"
                placeholder="Senha do usuario"
                required
              />

            </div>

            <DialogFooter>
              
              <Button variant="destructive" type="button" onClick={() => handleShowModal(false)}>
                Cancelar
              </Button>
              
              <Button type="submit" disabled={submiting}>
                { submiting ? "Criando..." : "Criar" }
              </Button>
    
            </DialogFooter>


          </form>
        </DialogContent> 
      </Dialog>

    </main>
  )
}
