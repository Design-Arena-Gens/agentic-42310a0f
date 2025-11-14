import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatGold } from "@/lib/utils";
import type { PlayerResponse } from "@/types/game";

type Props = {
  data: PlayerResponse;
  refresh: () => Promise<void>;
};

type PendingAd = {
  token: string;
  signature: string;
  rewardGold: number;
  allowedNetworks: string[];
};

export function AdsPanel({ data, refresh }: Props) {
  const [pendingAd, setPendingAd] = useState<PendingAd | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState("UnityAds");
  const [error, setError] = useState<string | null>(null);

  const startAd = async () => {
    try {
      setError(null);
      const response = await axios.post(
        "/api/ads/start",
        {},
        { headers: { "x-user-id": data.user.id } }
      );
      setPendingAd(response.data);
      setSelectedNetwork(response.data.allowedNetworks[0]);
      setCountdown(20);
      setIsWatching(true);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível iniciar o anúncio.");
    }
  };

  const completeAd = useCallback(async () => {
    if (!pendingAd) return;
    try {
      await axios.post(
        "/api/ads/complete",
        {
          token: pendingAd.token,
          signature: pendingAd.signature,
          network: selectedNetwork
        },
        { headers: { "x-user-id": data.user.id } }
      );
      setPendingAd(null);
      setIsWatching(false);
      setCountdown(0);
      await refresh();
    } catch (err: any) {
      console.error(err);
      setError("Validação do anúncio falhou.");
      setIsWatching(false);
      setCountdown(0);
    }
  }, [pendingAd, selectedNetwork, data.user.id, refresh]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isWatching && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((seconds) => {
          if (seconds <= 1) {
            interval && clearInterval(interval);
            completeAd();
          }
          return seconds - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, countdown, completeAd]);

  const remaining = data.settings.adDailyLimit - data.adViewsToday;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Anúncios recompensados</CardTitle>
          <CardDescription>Assista anúncios validados para ganhar GOLD instantaneamente.</CardDescription>
        </div>
        <div className="text-sm text-slate-400">
          Restam <span className="text-gold-200">{remaining}</span> anúncios hoje.
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-300">
            Recompensa por anúncio: <strong>{formatGold(data.settings.adRewardGold)}</strong>
          </p>
          <p className="text-xs text-slate-500">
            São suportados provedores Unity Ads, AdMob, AppLovin e IronSource. O vídeo precisa ser assistido até o fim e
            o token validado pelo servidor.
          </p>
          <div className="space-y-2">
            <label htmlFor="ad-network" className="text-xs uppercase tracking-wide text-slate-500">
              Rede de anúncio
            </label>
            <Select
              id="ad-network"
              value={selectedNetwork}
              onChange={(event) => setSelectedNetwork(event.target.value)}
            >
              {(pendingAd?.allowedNetworks ?? ["UnityAds", "AdMob", "AppLovin", "IronSource"]).map((network) => (
                <option key={network} value={network}>
                  {network}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={startAd} disabled={isWatching || remaining <= 0}>
            {isWatching ? "Assistindo..." : "Assistir anúncio"}
          </Button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-300">Progresso</p>
          {isWatching ? (
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-2 bg-gold-500 transition-all"
                  style={{ width: `${((20 - countdown) / 20) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">Tempo restante: {countdown}s</p>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-500">
              Clique em &quot;Assistir anúncio&quot; para iniciar um vídeo recompensado e receber GOLD ao final.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
