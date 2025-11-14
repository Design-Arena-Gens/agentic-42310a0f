import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

const BOXES = [
  { key: "bronze", name: "Bronze Nebuloso", cost: 80, description: "Recompensas básicas com chance de NFT comum." },
  { key: "silver", name: "Silver Spectrum", cost: 180, description: "Probabilidades elevadas e boosts especiais." },
  { key: "gold", name: "Gold Singularity", cost: 420, description: "Grande chance para NFTs épicos ou lendários." }
];

export function BoxesPanel({ data, refresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<Record<string, unknown> | null>(null);

  const openBox = async (key: string) => {
    try {
      setLoading(key);
      const response = await axios.post(
        "/api/boxes/open",
        { box: key },
        { headers: { "x-user-id": data.user.id } }
      );
      setLastReward(response.data.reward);
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
        <CardTitle>Loot Boxes</CardTitle>
        <CardDescription>
          Abrir caixas rende recompensas imediatas: GOLD, energia, NFTs raros ou boosts poderosos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {BOXES.map((box) => (
          <div key={box.key} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-lg font-semibold text-white">{box.name}</p>
            <p className="mt-2 text-sm text-slate-400">{box.description}</p>
            <p className="mt-2 text-sm text-gold-200">Custo: {formatGold(box.cost)}</p>
            <Button className="mt-4 w-full" onClick={() => openBox(box.key)} disabled={loading === box.key}>
              {loading === box.key ? "Abrindo..." : "Abrir caixa"}
            </Button>
          </div>
        ))}
      </CardContent>
      {lastReward ? (
        <div className="border-t border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
          <p className="text-slate-400">Última recompensa:</p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950/70 p-3 text-xs text-slate-400">
            {JSON.stringify(lastReward, null, 2)}
          </pre>
        </div>
      ) : null}
    </Card>
  );
}
