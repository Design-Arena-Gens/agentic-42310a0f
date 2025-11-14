import { useState } from "react";
import axios from "axios";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

export function GoldPanel({ data, refresh }: Props) {
  const [purchaseUsd, setPurchaseUsd] = useState("10");
  const [withdrawGold, setWithdrawGold] = useState("100");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { userId } = useSession();

  const handlePurchase = async () => {
    if (!userId) return;
    const usdAmount = Number(purchaseUsd);
    if (!usdAmount || usdAmount <= 0) return;
    try {
      setIsPurchasing(true);
      await axios.post(
        "/api/gold/purchase",
        { usdAmount },
        {
          headers: { "x-user-id": userId }
        }
      );
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userId) return;
    const goldAmount = Number(withdrawGold);
    if (!goldAmount || goldAmount <= 0) return;
    try {
      setIsWithdrawing(true);
      await axios.post(
        "/api/gold/withdraw",
        { goldAmount },
        {
          headers: { "x-user-id": userId }
        }
      );
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Economia GOLD</CardTitle>
        <CardDescription>Compre ou saque GOLD utilizando as taxas definidas pelo administrador.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-300">Comprar GOLD</p>
          <p className="text-xs text-slate-500">
            Taxa atual: 1 USD = {formatGold(data.settings.goldPurchaseRate)}
          </p>
          <Input
            type="number"
            min={1}
            step={1}
            value={purchaseUsd}
            onChange={(event) => setPurchaseUsd(event.target.value)}
            placeholder="Valor em USD"
          />
          <p className="text-xs text-slate-400">
            Você receberá {formatGold(Number(purchaseUsd || 0) * data.settings.goldPurchaseRate)}.
          </p>
          <Button onClick={handlePurchase} disabled={isPurchasing}>
            {isPurchasing ? "Processando..." : "Comprar GOLD"}
          </Button>
        </div>
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-300">Solicitar saque</p>
          <p className="text-xs text-slate-500">
            Taxa atual: {data.settings.goldWithdrawRate.toFixed(2)} GOLD = 1 USD
          </p>
          <Input
            type="number"
            min={data.settings.goldWithdrawRate}
            step={data.settings.goldWithdrawRate}
            value={withdrawGold}
            onChange={(event) => setWithdrawGold(event.target.value)}
            placeholder="Quantidade em GOLD"
          />
          <p className="text-xs text-slate-400">
            Total em USD: {formatCurrency(Number(withdrawGold || 0) / data.settings.goldWithdrawRate)}
          </p>
          <Button onClick={handleWithdraw} disabled={isWithdrawing}>
            {isWithdrawing ? "Enviando..." : "Solicitar saque"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
