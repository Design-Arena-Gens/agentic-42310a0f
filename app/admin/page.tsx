'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import axios from "axios";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatGold } from "@/lib/utils";
import type { TransactionPayload } from "@/types/game";

const loginSchema = z.object({
  password: z.string().min(4)
});

const settingsSchema = z.object({
  goldPurchaseRate: z.coerce.number().min(1),
  goldWithdrawRate: z.coerce.number().min(1),
  adDailyLimit: z.coerce.number().min(1),
  adRewardGold: z.coerce.number().min(1),
  farmBaseMultiplier: z.coerce.number().min(0.1),
  adVerificationSecret: z.string().min(8)
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function AdminPage() {
  const { isAdmin, setIsAdmin, adminToken, setAdminToken, userId } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      setAdminToken(null);
    }
  }, [isAdmin, setAdminToken]);

  useEffect(() => {
    if (!userId) {
      router.replace("/");
    }
  }, [userId, router]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    reset
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    formState: { isSubmitting: isSettingsSubmitting },
    reset: resetSettings
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema)
  });

  const { data: metrics, mutate: mutateMetrics } = useSWR<{
    userCount: number;
    totalGold: number;
    totalUsd: number;
    nftCount: number;
    adRewardsToday: number;
    topUsers: { id: string; displayName: string; goldBalance: number; usdBalance: number }[];
  }>(isAdmin ? "/api/admin/metrics" : null);

  const { data: settings, mutate: mutateSettings } = useSWR<{ settings: SettingsForm }>(
    isAdmin ? "/api/admin/settings" : null,
    {
      onSuccess: (data) => {
        if (data?.settings) {
          resetSettings(data.settings);
        }
      }
    }
  );

  const { data: users } = useSWR<{
    users: {
      id: string;
      displayName: string;
      goldBalance: number;
      usdBalance: number;
      nfts: { template: { name: string; rarity: string } }[];
    }[];
  }>(isAdmin ? "/api/admin/users" : null);

  const { data: transactions } = useSWR<{ transactions: TransactionPayload[] }>(
    isAdmin ? "/api/admin/transactions?limit=40" : null
  );

  const onLogin = handleSubmit(async (values) => {
    try {
      const response = await axios.post("/api/admin/login", values, {
        headers: userId ? { "x-user-id": userId } : undefined
      });
      setAdminToken(response.data.token);
      setIsAdmin(true);
      reset();
    } catch (err) {
      console.error(err);
      setError("password", { message: "Senha inválida." });
    }
  });

  const onUpdateSettings = handleSettingsSubmit(async (values) => {
    if (!adminToken) return;
    await axios.put(
      "/api/admin/settings",
      values,
      {
        headers: {
          "x-admin-token": adminToken,
          ...(userId ? { "x-user-id": userId } : {})
        }
      }
    );
    await Promise.all([mutateSettings(), mutateMetrics()]);
  });

  if (!userId) {
    return null;
  }

  if (!isAdmin || !adminToken) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso administrativo</CardTitle>
            <CardDescription>Informe a senha de administrador para gerenciar a economia do jogo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="text-sm text-slate-300">
                  Senha
                </label>
                <Input id="password" type="password" {...register("password")} className="mt-1" />
                {errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Validando..." : "Entrar como admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-8 px-4 py-10 md:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel administrativo</h1>
          <p className="text-sm text-slate-400">
            Gerencie taxas, limites de anúncios, usuários e acompanhe métricas da economia GOLD.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setAdminToken(null);
            setIsAdmin(false);
          }}
        >
          Encerrar sessão admin
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-500">Jogadores</p>
          <p className="mt-2 text-2xl font-semibold text-white">{metrics?.userCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-500">GOLD movimentado</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatGold(metrics?.totalGold ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-500">USD equivalente</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(metrics?.totalUsd ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-500">NFTs em circulação</p>
          <p className="mt-2 text-2xl font-semibold text-white">{metrics?.nftCount ?? 0}</p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Configurações econômicas</CardTitle>
          <CardDescription>Atualize taxas de câmbio, limites de anúncios e multiplicadores de farm.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpdateSettings} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">GOLD por USD (compra)</label>
              <Input type="number" step={0.1} min={1} {...registerSettings("goldPurchaseRate", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">GOLD por USD (saque)</label>
              <Input type="number" step={0.1} min={1} {...registerSettings("goldWithdrawRate", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Limite diário de anúncios</label>
              <Input type="number" min={1} {...registerSettings("adDailyLimit", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Recompensa por anúncio (GOLD)</label>
              <Input type="number" min={1} {...registerSettings("adRewardGold", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Multiplicador base do farm</label>
              <Input step={0.1} min={0.1} type="number" {...registerSettings("farmBaseMultiplier", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Segredo de validação de anúncios</label>
              <Input type="text" {...registerSettings("adVerificationSecret")} />
            </div>
            <div className="md:col-span-2 flex items-center justify-end">
              <Button type="submit" disabled={isSettingsSubmitting}>
                {isSettingsSubmitting ? "Salvando..." : "Salvar configurações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top usuários por GOLD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {metrics?.topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400">#{index + 1}</span>
              <span className="flex-1 px-3 text-white">{user.displayName}</span>
              <span>{formatGold(user.goldBalance)}</span>
              <span className="ml-4 text-slate-500">{formatCurrency(user.usdBalance)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários recentes</CardTitle>
          <CardDescription>Resumo das aquisições de NFTs por usuário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          {users?.users.map((user) => (
            <div key={user.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-white">{user.displayName}</span>
                <span className="text-xs text-slate-500">{formatGold(user.goldBalance)}</span>
                <span className="text-xs text-slate-500">{formatCurrency(user.usdBalance)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase text-slate-500">
                {user.nfts.map((nft, index) => (
                  <span key={`${user.id}-${index}`} className="rounded bg-slate-800 px-2 py-1">
                    {nft.template.name} • {nft.template.rarity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transações recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-400">
          {transactions?.transactions.map((transaction) => (
            <div key={transaction.id} className="rounded border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex flex-wrap items-center gap-3 text-slate-300">
                <span className="text-white">{transaction.type}</span>
                <span>{formatGold(transaction.goldAmount)}</span>
                <span>{formatCurrency(transaction.usdAmount)}</span>
                {transaction.user?.displayName ? (
                  <span className="text-slate-500">{transaction.user.displayName}</span>
                ) : null}
              </div>
              {transaction.metadata ? (
                <pre className="mt-2 max-h-24 overflow-auto rounded bg-slate-950/60 p-2 text-[10px] text-slate-500">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
