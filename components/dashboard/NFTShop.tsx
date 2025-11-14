import useSWR from "swr";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

type NFTTemplate = {
  id: number;
  name: string;
  rarity: string;
  goldPerHour: number;
  basePriceGold: number;
  description: string;
  imageUrl: string;
};

const rarityStyles: Record<string, string> = {
  COMMON: "border-slate-700",
  RARE: "border-blue-500/40",
  EPIC: "border-purple-500/40",
  LEGENDARY: "border-amber-400/50",
  MYTHIC: "border-rose-400/50"
};

export function NFTShop({ data, refresh }: Props) {
  const { data: templatesData } = useSWR<{ templates: NFTTemplate[] }>("/api/shop/nfts");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const buyNft = async (templateId: number) => {
    try {
      setLoadingId(templateId);
      await axios.post(
        "/api/shop/nfts",
        { templateId },
        { headers: { "x-user-id": data.user.id } }
      );
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace NFT</CardTitle>
        <CardDescription>Invista em NFTs com diferentes raridades e potência de farm.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templatesData?.templates.map((template) => {
          const owned = data.user.nfts.filter((nft) => nft.template.id === template.id).length;
          return (
            <div
              key={template.id}
              className={`rounded-xl border ${rarityStyles[template.rarity] ?? "border-slate-700"} bg-slate-900/60 p-4`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={template.imageUrl}
                  alt={template.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-lg border border-slate-800 bg-slate-900 object-cover"
                />
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">{template.rarity}</p>
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">{template.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <span>Farm: {formatGold(template.goldPerHour)}/h</span>
                <span>Preço: {formatGold(template.basePriceGold)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">Você possui: {owned}</span>
                <Button size="sm" onClick={() => buyNft(template.id)} disabled={loadingId === template.id}>
                  {loadingId === template.id ? "Comprando..." : "Comprar"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
