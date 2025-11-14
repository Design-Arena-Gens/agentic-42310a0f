'use client';

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(3, "Informe um usuário válido").max(32)
});

const registerSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres").max(32),
  displayName: z.string().min(3, "Informe um nome de exibição")
});

export default function LandingPage() {
  const router = useRouter();
  const { userId, setUserId } = useSession();

  useEffect(() => {
    if (userId) {
      router.push("/dashboard");
    }
  }, [router, userId]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors: loginErrors },
    setError
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { isSubmitting: isRegisterSubmitting, errors: registerErrors },
    setError: setRegisterError
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema)
  });

  const onLogin = handleSubmit(async (values) => {
    try {
      const response = await axios.post("/api/auth/login", values);
      setUserId(response.data.user.id);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setError("username", { message: "Não foi possível entrar com esse usuário." });
    }
  });

  const onRegister = handleRegisterSubmit(async (values) => {
    try {
      const response = await axios.post("/api/auth/register", values);
      setUserId(response.data.user.id);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      if (error?.response?.status === 409) {
        setRegisterError("username", { message: "Este usuário já existe." });
      } else {
        setRegisterError("username", { message: "Erro ao criar conta." });
      }
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-2">
        <section className="space-y-6">
          <span className="inline-block rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1 text-xs uppercase tracking-widest text-gold-300">
            Aurora Arena
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            Construa sua fortuna em um mundo NFT Play-to-Earn vibrante.
          </h1>
          <p className="text-slate-400">
            Colecione NFTs raros, impulsione seu farm de GOLD, participe de batalhas estratégicas, abra loot boxes
            valiosas e monetize com anúncios recompensados.
          </p>
          <div className="grid gap-4 text-sm text-slate-300 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="font-semibold text-gold-200">Economia GOLD dinâmica</p>
              <span>Compra e saque configuráveis com conversões automáticas para USD.</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="font-semibold text-gold-200">Farm NFT estratégico</p>
              <span>Raridades únicas, boosts temporários e ganhos passivos acumulados por hora.</span>
            </div>
          </div>
        </section>
        <section className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Entrar na conta</CardTitle>
              <CardDescription>Acesse sua conta existente para continuar farmando GOLD.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-username" className="text-sm font-medium text-slate-200">
                    Usuário
                  </label>
                  <Input
                    id="login-username"
                    placeholder="ex: blockchain_heroi"
                    {...register("username")}
                    className={cn(loginErrors.username ? "border-red-500/60" : undefined)}
                  />
                  {loginErrors.username ? (
                    <p className="text-xs text-red-400">{loginErrors.username.message}</p>
                  ) : null}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>Comece agora mesmo com um perfil único.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="register-username" className="text-sm font-medium text-slate-200">
                    Usuário
                  </label>
                  <Input
                    id="register-username"
                    placeholder="ex: aurora_master"
                    {...registerRegister("username")}
                    className={cn(registerErrors.username ? "border-red-500/60" : undefined)}
                  />
                  {registerErrors.username ? (
                    <p className="text-xs text-red-400">{registerErrors.username.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-display" className="text-sm font-medium text-slate-200">
                    Nome de exibição
                  </label>
                  <Input
                    id="register-display"
                    placeholder="ex: Aurora Master"
                    {...registerRegister("displayName")}
                    className={cn(registerErrors.displayName ? "border-red-500/60" : undefined)}
                  />
                  {registerErrors.displayName ? (
                    <p className="text-xs text-red-400">{registerErrors.displayName.message}</p>
                  ) : null}
                </div>
                <Button type="submit" disabled={isRegisterSubmitting} className="w-full" variant="outline">
                  {isRegisterSubmitting ? "Criando..." : "Criar nova conta"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
