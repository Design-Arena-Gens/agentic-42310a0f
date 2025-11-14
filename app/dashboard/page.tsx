'use client';

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { GoldPanel } from "@/components/dashboard/GoldPanel";
import { FarmPanel } from "@/components/dashboard/FarmPanel";
import { AdsPanel } from "@/components/dashboard/AdsPanel";
import { NFTShop } from "@/components/dashboard/NFTShop";
import { EnergyPanel } from "@/components/dashboard/EnergyPanel";
import { BoostsPanel } from "@/components/dashboard/BoostsPanel";
import { BoxesPanel } from "@/components/dashboard/BoxesPanel";
import { CosmeticsPanel } from "@/components/dashboard/CosmeticsPanel";
import { BattlesPanel } from "@/components/dashboard/BattlesPanel";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { InventoryPanel } from "@/components/dashboard/InventoryPanel";
import { useSession } from "@/hooks/useSession";
import type { PlayerResponse } from "@/types/game";

export default function DashboardPage() {
  const { userId, setUserId, isAdmin } = useSession();
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<PlayerResponse>(userId ? "/api/player/me" : null);

  useEffect(() => {
    if (!userId) {
      router.replace("/");
    }
  }, [userId, router]);

  if (!userId) {
    return null;
  }

  const logout = () => {
    setUserId(null);
    router.replace("/");
  };

  if (isLoading || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center text-slate-400">
        <p>Carregando sua central de controle...</p>
      </main>
    );
  }

  const refresh = async () => {
    await mutate();
  };

  return (
    <main className="min-h-screen space-y-8 px-4 py-10 md:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bem-vindo(a), {data.user.displayName}</h1>
          <p className="text-sm text-slate-400">
            Administre sua economia GOLD, NFTs, energia e batalhas diretamente do painel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Button asChild variant="outline">
              <Link href="/admin">Painel Admin</Link>
            </Button>
          ) : null}
          <Button variant="ghost" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>
      <SummaryCards data={data} />
      <GoldPanel data={data} refresh={refresh} />
      <FarmPanel data={data} refresh={refresh} />
      <AdsPanel data={data} refresh={refresh} />
      <NFTShop data={data} refresh={refresh} />
      <InventoryPanel data={data} />
      <EnergyPanel data={data} refresh={refresh} />
      <BoostsPanel data={data} refresh={refresh} />
      <BoxesPanel data={data} refresh={refresh} />
      <CosmeticsPanel data={data} refresh={refresh} />
      <BattlesPanel data={data} refresh={refresh} />
      <TransactionsTable transactions={data.transactions} />
    </main>
  );
}
