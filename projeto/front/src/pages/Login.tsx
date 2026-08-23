import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020817] p-4">

    <InteractiveGridPattern
      width={40}
      height={40}
      squares={[45, 45]}
      squaresClassName="
        fill-transparent
        stroke-white/10
        transition-[fill,stroke]
        duration-[900ms]
        ease-out
        hover:duration-75
        hover:fill-blue-500/25
        hover:stroke-blue-400/50
       "
       className={cn(
        "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
        "absolute -top-20 inset-x-0 h-[200%] w-full skew-y-12"
       )}
      />

      
      <a
        href="/argentino.jpg"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Easter egg"
        className="
          absolute
         left-[25%]
         top-[35%]
         z-[5]
         h-[42px]
         w-[42px]
         cursor-pointer
        "
       />

<div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />

<div className="relative z-10 flex flex-col items-center -translate-y-12 ...">
        <img
          src="/iconepaginas.png"
          alt="Monitoramento Escolar"
          className="mb-6 h-32 w-auto object-contain"
        />
        <Card className="w-full max-w-md border border-white/20 bg-white/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-blue-700">
              Monitoramento Escolar
            </CardTitle>
            <CardDescription>
              Acesse sua conta para monitorar a sala
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="professor@escola.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <p className="text-sm text-center text-slate-600">
                Não tem uma conta?{" "}
                <a
                  href="/signup"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Criar conta
                </a>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

    </div>
  );
}
