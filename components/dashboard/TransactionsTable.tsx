import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatGold } from "@/lib/utils";
import type { TransactionPayload } from "@/types/game";

type Props = {
  transactions: TransactionPayload[];
};

const labels: Record<string, string> = {
  PURCHASE_GOLD: "Compra GOLD",
  WITHDRAW_GOLD: "Saque",
  BUY_NFT: "Compra NFT",
  FARM_REWARD: "Farm",
  AD_REWARD: "Anúncio",
  BUY_ENERGY: "Energia",
  BUY_BOOST: "Boost",
  BATTLE_ENTRY: "Entrada batalha",
  BATTLE_REWARD: "Recompensa batalha",
  BUY_BOX: "Loot box",
  BUY_COSMETIC: "Cosmético",
  ADMIN_ADJUSTMENT: "Ajuste admin"
};

export function TransactionsTable({ transactions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas operações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 md:grid-cols-[1.5fr_1fr_1fr]"
          >
            <div>
              <p className="font-semibold text-white">{labels[transaction.type] ?? transaction.type}</p>
              <p className="text-xs text-slate-500">
                {format(new Date(transaction.createdAt), "dd MMM yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="text-xs text-slate-400">
              <p>{formatGold(transaction.goldAmount)}</p>
              <p>{formatCurrency(transaction.usdAmount)}</p>
            </div>
            <div className="text-xs text-slate-500">
              {transaction.note ? <p>Obs: {transaction.note}</p> : null}
              {transaction.metadata ? (
                <pre className="mt-1 max-h-16 overflow-auto rounded bg-slate-950/60 p-2 text-[10px] text-slate-500">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
