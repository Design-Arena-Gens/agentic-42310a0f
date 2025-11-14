import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
};

const rarityLabels: Record<string, string> = {
  COMMON: "Comum",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Lendário",
  MYTHIC: "Mítico"
};

export function SummaryCards({ data }: Props) {
  const { user, farm, settings, adViewsToday } = data;
  const nftCount = user.nfts.length;
  const totalFarmPerHour = user.nfts.reduce((acc, nft) => acc + nft.template.goldPerHour, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Carteira GOLD</CardDescription>
          <CardTitle className="text-3xl">{formatGold(user.goldBalance)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          <p>{formatCurrency(user.goldBalance / settings.goldWithdrawRate)}</p>
          <p className="mt-2 text-xs text-slate-500">
            Taxa de compra: {settings.goldPurchaseRate.toFixed(2)} GOLD = 1 USD
          </p>
          <p className="text-xs text-slate-500">
            Taxa de saque: {settings.goldWithdrawRate.toFixed(2)} GOLD = 1 USD
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Saldo USD gerado</CardDescription>
          <CardTitle className="text-3xl">{formatCurrency(user.usdBalance)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          <p>Conversão automática a partir de farm, batalhas e anúncios.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Farm disponível</CardDescription>
          <CardTitle className="text-3xl">{formatGold(farm.gold)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          <p>
            {totalFarmPerHour} GOLD/h • {nftCount} NFT{nftCount === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Último claim há {Math.floor(farm.minutes / 60)}h{farm.minutes % 60}m
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Anúncios</CardDescription>
          <CardTitle className="text-3xl">
            {adViewsToday}/{data.settings.adDailyLimit}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          <p>Recompensa: {formatGold(settings.adRewardGold)} por anúncio validado.</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle>Inventário NFT</CardTitle>
          <CardDescription>Resumo das raridades em sua coleção.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          {["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"].map((rarity) => {
            const count = user.nfts.filter((nft) => nft.template.rarity === rarity).length;
            return (
              <div
                key={rarity}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-center text-sm text-slate-300"
              >
                <p className="font-semibold text-gold-200">{rarityLabels[rarity] ?? rarity}</p>
                <p className="mt-1 text-2xl font-bold text-white">{count}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
