import { differenceInMinutes } from "date-fns";
import useSWR from "swr";
import axios from "axios";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

type BoostTemplate = {
  id: number;
  name: string;
  description: string;
  goldCost: number;
  multiplier: number;
  durationHours: number;
};

export function BoostsPanel({ data, refresh }: Props) {
  const { data: boostsData } = useSWR<{ boosts: BoostTemplate[] }>("/api/boosts");
  const [loading, setLoading] = useState<number | null>(null);

  const activeBoosts = useMemo(() => {
    const now = new Date();
    return data.user.boosts
      .filter((boost) => new Date(boost.expiresAt) > now)
      .map((boost) => ({
        ...boost,
        remainingMinutes: differenceInMinutes(new Date(boost.expiresAt), now)
      }));
  }, [data.user.boosts]);

  const buyBoost = async (templateId: number) => {
    try {
      setLoading(templateId);
      await axios.post(
        "/api/boosts",
        { templateId },
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
        <CardTitle>Boosts temporários</CardTitle>
        <CardDescription>Amplifique seu farm ou otimize o uso de energia com boosts temporários.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm font-semibold text-gold-200">Boosts ativos</p>
          {activeBoosts.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum boost ativo no momento.</p>
          ) : (
            <div className="space-y-3 text-sm text-slate-300">
              {activeBoosts.map((boost) => (
                <div key={boost.id} className="rounded-lg border border-slate-800/70 bg-slate-900/70 p-3">
                  <p className="font-semibold text-white">{boost.template.name}</p>
                  <p className="text-xs text-slate-400">{boost.template.description}</p>
                  <p className="text-xs text-slate-500">
                    Multiplicador x{boost.template.multiplier.toFixed(2)} • expira em {Math.max(0, boost.remainingMinutes)}{" "}
                    min
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm font-semibold text-gold-200">Loja de boosts</p>
          <div className="space-y-3">
            {boostsData?.boosts.map((boost) => (
              <div key={boost.id} className="rounded-lg border border-slate-800/70 bg-slate-900/70 p-3 text-sm">
                <p className="font-semibold text-white">{boost.name}</p>
                <p className="text-xs text-slate-400">{boost.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Duração: {boost.durationHours}h</span>
                  <span>Custo: {formatGold(boost.goldCost)}</span>
                </div>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => buyBoost(boost.id)}
                  disabled={loading === boost.id}
                >
                  {loading === boost.id ? "Adquirindo..." : "Comprar Boost"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
