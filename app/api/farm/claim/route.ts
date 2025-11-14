import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateFarmAccrual, goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireUser();

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const farm = calculateFarmAccrual(user.nfts, user.farmLastClaimedAt, user.boosts, settings);

    if (farm.gold <= 0) {
      return NextResponse.json({ error: "NOTHING_TO_CLAIM" }, { status: 400 });
    }

    const usdAmount = goldToUsd(farm.gold, settings.goldWithdrawRate);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { increment: farm.gold },
        usdBalance: { increment: usdAmount },
        farmLastClaimedAt: new Date()
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "FARM_REWARD",
        goldAmount: farm.gold,
        usdAmount,
        metadata: JSON.stringify(farm)
      }
    });

    return NextResponse.json({ farm, user: updatedUser, usdAmount });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
