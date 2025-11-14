import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

const BATTLE_MODES = {
  skirmish: { entryGold: 50, rewardGold: 90, energyCost: 20, winChance: 0.6 },
  raid: { entryGold: 120, rewardGold: 220, energyCost: 40, winChance: 0.45 },
  tournament: { entryGold: 300, rewardGold: 620, energyCost: 60, winChance: 0.35 }
} as const;

type BattleMode = keyof typeof BATTLE_MODES;

export async function GET() {
  const battles = await prisma.battle.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
    include: {
      participants: {
        include: {
          user: { select: { displayName: true } }
        }
      }
    }
  });

  return NextResponse.json({ battles, modes: BATTLE_MODES });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const mode = String(data?.mode ?? "skirmish") as BattleMode;
    const battleMode = BATTLE_MODES[mode] ?? BATTLE_MODES.skirmish;

    if (user.goldBalance < battleMode.entryGold) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    if (user.energy < battleMode.energyCost) {
      return NextResponse.json({ error: "INSUFFICIENT_ENERGY" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const entryUsd = goldToUsd(battleMode.entryGold, settings.goldWithdrawRate);
    const rewardUsd = goldToUsd(battleMode.rewardGold, settings.goldWithdrawRate);

    const battle = await prisma.battle.create({
      data: {
        entryGold: battleMode.entryGold,
        rewardGold: battleMode.rewardGold,
        rewardUsd,
        startedAt: new Date()
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: battleMode.entryGold },
        energy: { decrement: battleMode.energyCost }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BATTLE_ENTRY",
        goldAmount: -battleMode.entryGold,
        usdAmount: entryUsd,
        metadata: JSON.stringify({ mode })
      }
    });

    const didWin = Math.random() <= battleMode.winChance;
    let result: "WIN" | "LOSS";
    if (didWin) {
      result = "WIN";
      await prisma.user.update({
        where: { id: user.id },
        data: {
          goldBalance: { increment: battleMode.rewardGold },
          usdBalance: { increment: rewardUsd }
        }
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "BATTLE_REWARD",
          goldAmount: battleMode.rewardGold,
          usdAmount: rewardUsd,
          metadata: JSON.stringify({ mode })
        }
      });
    } else {
      result = "LOSS";
    }

    await prisma.battleParticipation.create({
      data: {
        battleId: battle.id,
        userId: user.id,
        result
      }
    });

    await prisma.battle.update({
      where: { id: battle.id },
      data: {
        resolvedAt: new Date()
      }
    });

    return NextResponse.json({ result, didWin, user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
