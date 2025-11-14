import useSWR from "swr";
import axios from "axios";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

type BattleMode = {
  entryGold: number;
  rewardGold: number;
  energyCost: number;
  winChance: number;
};

type Battle = {
  id: string;
  entryGold: number;
  rewardGold: number;
  startedAt: string;
  resolvedAt: string | null;
  participants: {
    id: string;
    result: "WIN" | "LOSS" | "DRAW";
    user: { displayName: string };
  }[];
};

export function BattlesPanel({ data, refresh }: Props) {
  const { data: battlesData, mutate } = useSWR<{ modes: Record<string, BattleMode>; battles: Battle[] }>(
    "/api/battles"
  );
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ result: "WIN" | "LOSS"; mode: string } | null>(null);

  const enterBattle = async (mode: string) => {
    try {
      setLoadingMode(mode);
      const response = await axios.post(
        "/api/battles",
        { mode },
        { headers: { "x-user-id": data.user.id } }
      );
      setLastResult({ result: response.data.didWin ? "WIN" : "LOSS", mode });
      await Promise.all([refresh(), mutate()]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campo de batalha</CardTitle>
        <CardDescription>Arrisque GOLD e energia para competir em batalhas PvE e ganhar recompensas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {battlesData
            ? Object.entries(battlesData.modes).map(([mode, config]) => (
                <div key={mode} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                  <p className="text-lg font-semibold text-white capitalize">{mode}</p>
                  <p className="mt-2 text-xs text-slate-400">Custo de entrada: {formatGold(config.entryGold)}</p>
                  <p className="text-xs text-slate-400">Energia: -{config.energyCost}</p>
                  <p className="text-xs text-slate-400">Prêmio: {formatGold(config.rewardGold)}</p>
                  <p className="text-xs text-slate-500">
                    Chance de vitória estimada: {(config.winChance * 100).toFixed(0)}%
                  </p>
                  <Button className="mt-3 w-full" onClick={() => enterBattle(mode)} disabled={loadingMode === mode}>
                    {loadingMode === mode ? "Entrando..." : "Participar"}
                  </Button>
                </div>
              ))
            : null}
        </div>
        {lastResult ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
            Resultado recente:{" "}
            <span className={lastResult.result === "WIN" ? "text-gold-200" : "text-red-400"}>
              {lastResult.result === "WIN" ? "Vitória!" : "Derrota"}
            </span>{" "}
            no modo <strong>{lastResult.mode}</strong>.
          </div>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-slate-200">Histórico recente</p>
          <div className="mt-3 space-y-2">
            {battlesData?.battles.map((battle) => (
              <div key={battle.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-300">
                    {formatGold(battle.entryGold)} ➜ {formatGold(battle.rewardGold)}
                  </span>
                  <span>
                    Iniciado {formatDistanceToNow(new Date(battle.startedAt), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {battle.participants.map((participant) => (
                    <span key={participant.id} className="rounded bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide">
                      {participant.user.displayName}:{" "}
                      <span className={participant.result === "WIN" ? "text-gold-200" : "text-red-400"}>
                        {participant.result === "WIN" ? "Vitória" : "Derrota"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
