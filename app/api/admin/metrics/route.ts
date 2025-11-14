import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireAdminToken();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [userCount, totalGold, totalUsd, nftCount, adRewardsToday] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.aggregate({
      _sum: { goldAmount: true }
    }),
    prisma.transaction.aggregate({
      _sum: { usdAmount: true }
    }),
    prisma.nFTInstance.count(),
    prisma.transaction.aggregate({
      _sum: { goldAmount: true },
      where: {
        type: "AD_REWARD",
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ]);

  const topUsers = await prisma.user.findMany({
    orderBy: { goldBalance: "desc" },
    take: 5,
    select: {
      id: true,
      displayName: true,
      goldBalance: true,
      usdBalance: true
    }
  });

  return NextResponse.json({
    userCount,
    totalGold: totalGold._sum.goldAmount ?? 0,
    totalUsd: totalUsd._sum.usdAmount ?? 0,
    nftCount,
    adRewardsToday: adRewardsToday._sum.goldAmount ?? 0,
    topUsers
  });
}
