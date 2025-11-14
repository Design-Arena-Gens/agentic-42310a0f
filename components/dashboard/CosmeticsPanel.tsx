import useSWR from "swr";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Cosmetic = {
  id: number;
  name: string;
  description: string;
  goldCost: number;
  imageUrl: string;
};

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

export function CosmeticsPanel({ data, refresh }: Props) {
  const { data: cosmeticsData } = useSWR<{ cosmetics: Cosmetic[] }>("/api/cosmetics");
  const [loading, setLoading] = useState<number | null>(null);

  const buyCosmetic = async (itemId: number) => {
    try {
      setLoading(itemId);
      await axios.post(
        "/api/cosmetics",
        { itemId },
        { headers: { "x-user-id": data.user.id } }
      );
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens cosméticos</CardTitle>
        <CardDescription>Personalize seu avatar com visuais exclusivos e efeitos especiais.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {cosmeticsData?.cosmetics.map((cosmetic) => {
          const owned = data.user.cosmetics.some((item) => item.item.id === cosmetic.id);
          return (
            <div key={cosmetic.id} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <Image
                src={cosmetic.imageUrl}
                alt={cosmetic.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg border border-slate-800 bg-slate-950 object-cover"
              />
              <div className="flex flex-1 flex-col">
                <p className="text-lg font-semibold text-white">{cosmetic.name}</p>
                <p className="text-sm text-slate-400">{cosmetic.description}</p>
                <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                  <span>Custo: {formatGold(cosmetic.goldCost)}</span>
                  <Button size="sm" onClick={() => buyCosmetic(cosmetic.id)} disabled={owned || loading === cosmetic.id}>
                    {owned ? "Já adquirido" : loading === cosmetic.id ? "Comprando..." : "Comprar"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
