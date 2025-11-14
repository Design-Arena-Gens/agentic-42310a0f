import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

export function FarmPanel({ data, refresh }: Props) {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      await axios.post(
        "/api/farm/claim",
        {},
        {
          headers: { "x-user-id": data.user.id }
        }
      );
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Farm Passivo NFT</CardTitle>
          <CardDescription>
            Acumule GOLD automaticamente com base na raridade total da sua coleção e boosts ativos.
          </CardDescription>
        </div>
        <Button onClick={handleClaim} disabled={data.farm.gold <= 0 || isClaiming}>
          {isClaiming ? "Reivindicando..." : data.farm.gold > 0 ? "Reivindicar farm" : "Sem saldo"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">GOLD acumulado</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatGold(data.farm.gold)}</p>
          <p className="text-sm text-slate-500">
            Equivalente a {formatCurrency(data.farm.gold / data.settings.goldWithdrawRate)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Produção base por hora</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatGold(data.farm.baseRate)}</p>
          <p className="text-sm text-slate-500">
            Boosts ativos multiplicam automaticamente esse valor e a contagem é atualizada a cada minuto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
