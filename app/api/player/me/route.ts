import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateFarmAccrual } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });

    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const farm = calculateFarmAccrual(user.nfts, user.farmLastClaimedAt, user.boosts, settings);

    const adViewsToday = await prisma.adView.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        consumed: true
      }
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const safeTransactions = transactions.map((transaction) => ({
      ...transaction,
      metadata: transaction.metadata ? safeParseJSON(transaction.metadata) : null
    }));

    return NextResponse.json({
      user,
      settings,
      farm,
      adViewsToday,
      transactions: safeTransactions
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}

function safeParseJSON(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
