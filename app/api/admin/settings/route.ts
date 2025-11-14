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

  const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    requireAdminToken();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const data = await request.json();

  const updated = await prisma.adminSetting.update({
    where: { id: 1 },
    data: {
      goldPurchaseRate: data.goldPurchaseRate ?? undefined,
      goldWithdrawRate: data.goldWithdrawRate ?? undefined,
      adDailyLimit: data.adDailyLimit ?? undefined,
      adRewardGold: data.adRewardGold ?? undefined,
      farmBaseMultiplier: data.farmBaseMultiplier ?? undefined,
      adVerificationSecret: data.adVerificationSecret ?? undefined
    }
  });

  return NextResponse.json({ settings: updated });
}
