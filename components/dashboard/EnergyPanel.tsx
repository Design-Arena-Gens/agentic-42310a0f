import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerResponse } from "@/types/game";
import { formatGold } from "@/lib/utils";

const PACKAGES: Record<string, { label: string; goldCost: number; energy: number }> = {
  small: { label: "Carga Pontual", goldCost: 40, energy: 80 },
  medium: { label: "Overcharge Médio", goldCost: 90, energy: 200 },
  large: { label: "Supercarga", goldCost: 180, energy: 450 }
};

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

export function EnergyPanel({ data, refresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const buyEnergy = async (pack: string) => {
    try {
      setLoading(pack);
      await axios.post(
        "/api/energy/purchase",
        { package: pack },
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
        <CardTitle>Gerenciamento de energia</CardTitle>
        <p className="text-sm text-slate-400">Energia usada em batalhas e boosts de farm. Máximo de 500 pontos.</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {Object.entries(PACKAGES).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-base font-semibold text-white">{value.label}</p>
            <p className="mt-2 text-xs text-slate-400">Energia: +{value.energy}</p>
            <p className="mt-1 text-xs text-slate-400">Custo: {formatGold(value.goldCost)}</p>
            <Button className="mt-4 w-full" onClick={() => buyEnergy(key)} disabled={loading === key}>
              {loading === key ? "Carregando..." : "Comprar"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
