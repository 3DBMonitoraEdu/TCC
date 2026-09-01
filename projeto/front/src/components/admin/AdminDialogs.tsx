import type { FormEvent } from "react";
import { Building2, LoaderCircle, UserPlus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Schools } from "@/types";

type DialogBaseProps = {
  open: boolean;
  submitting: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
};

type CreateUserDialogProps = DialogBaseProps & {
  schools: Schools[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type CreateSchoolDialogProps = DialogBaseProps & {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateUserDialog({
  open,
  submitting,
  error,
  schools,
  onOpenChange,
  onSubmit,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[520px]">
        <form onSubmit={onSubmit}>
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 pr-12 text-left">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <UserPlus className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl text-slate-950">Novo usuário</DialogTitle>
            <DialogDescription>
              Crie uma conta de acesso e vincule-a a uma instituição.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            {error && (
              <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="user-name">Nome completo</Label>
              <Input id="user-name" name="name" placeholder="Ex.: Mariana Oliveira" autoComplete="name" disabled={submitting} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">E-mail</Label>
              <Input id="user-email" name="email" type="email" placeholder="nome@escola.com.br" autoComplete="email" disabled={submitting} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="user-password">Senha temporária</Label>
                <span className="text-[11px] text-slate-400">Mínimo de 8 caracteres</span>
              </div>
              <Input id="user-password" name="password" type="password" minLength={8} placeholder="••••••••" autoComplete="new-password" disabled={submitting} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-school">Instituição</Label>
              <Select name="schoolId" required disabled={submitting}>
                <SelectTrigger id="user-school" className="w-full">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {schools.length === 0 && (
                <p className="text-xs text-amber-600">Cadastre uma instituição antes de criar um usuário.</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting || schools.length === 0} className="bg-sky-600 hover:bg-sky-700">
              {submitting ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
              {submitting ? "Criando usuário..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateSchoolDialog({
  open,
  submitting,
  error,
  onOpenChange,
  onSubmit,
}: CreateSchoolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[480px]">
        <form onSubmit={onSubmit}>
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 pr-12 text-left">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Building2 className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl text-slate-950">Nova instituição</DialogTitle>
            <DialogDescription>
              Cadastre uma escola para organizar usuários, salas e computadores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            {error && (
              <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="school-name">Nome da instituição</Label>
              <Input id="school-name" name="name" placeholder="Ex.: Escola Municipal Horizonte" autoFocus disabled={submitting} required />
              <p className="text-xs text-slate-400">Use o nome oficial para facilitar a identificação.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              {submitting ? <LoaderCircle className="animate-spin" /> : <Building2 />}
              {submitting ? "Cadastrando..." : "Cadastrar instituição"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
