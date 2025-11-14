import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerResponse } from "@/types/game";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  data: PlayerResponse;
};

export function InventoryPanel({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventário NFT detalhado</CardTitle>
        <CardDescription>Todas as coleções adquiridas e respectivas taxas de farm.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.user.nfts.map((nft) => (
          <div key={nft.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <Image
                src={nft.template.imageUrl}
                alt={nft.template.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-lg border border-slate-800 bg-slate-950 object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{nft.template.rarity}</p>
                <p className="text-base font-semibold text-white">{nft.template.name}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">{nft.template.description}</p>
            <div className="mt-3 text-xs text-slate-500">
              <p>Farm: {nft.template.goldPerHour} GOLD/h</p>
              <p>Adquirido em: {format(new Date(nft.acquiredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
        ))}
        {data.user.nfts.length === 0 ? (
          <p className="text-sm text-slate-400">Você ainda não possui NFTs. Compre na loja para iniciar o farm.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
