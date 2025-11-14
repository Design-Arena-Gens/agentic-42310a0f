import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";
import type { SupportedAdNetwork } from "../start/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const token = String(data?.token ?? "");
    const signature = String(data?.signature ?? "");
    const network = String(data?.network ?? "") as SupportedAdNetwork;

    if (!token || !signature) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const expectedSignature = createHmac("sha256", settings.adVerificationSecret).update(token).digest("hex");
    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
    }

    const adView = await prisma.adView.findUnique({ where: { token } });
    if (!adView || adView.userId !== user.id) {
      return NextResponse.json({ error: "AD_NOT_FOUND" }, { status: 404 });
    }

    if (adView.consumed) {
      return NextResponse.json({ error: "ALREADY_REDEEMED" }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const consumedToday = await prisma.adView.count({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart },
        consumed: true
      }
    });

    if (consumedToday >= settings.adDailyLimit) {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED" }, { status: 400 });
    }

    const usdAmount = goldToUsd(adView.rewardGold, settings.goldWithdrawRate);

    await prisma.adView.update({
      where: { token },
      data: {
        consumed: true
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { increment: adView.rewardGold },
        usdBalance: { increment: usdAmount }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "AD_REWARD",
        goldAmount: adView.rewardGold,
        usdAmount,
        metadata: JSON.stringify({ token, network })
      }
    });

    return NextResponse.json({ user: updatedUser, rewardGold: adView.rewardGold, usdAmount });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
