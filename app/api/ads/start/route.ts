import { NextResponse } from "next/server";
import { randomUUID, createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const AD_NETWORKS = ["UnityAds", "AdMob", "AppLovin", "IronSource"] as const;

export type SupportedAdNetwork = (typeof AD_NETWORKS)[number];

export async function POST() {
  try {
    const user = await requireUser();

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
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

    const token = randomUUID();

    await prisma.adView.create({
      data: {
        userId: user.id,
        rewardGold: settings.adRewardGold,
        token,
        consumed: false
      }
    });

    const signature = createHmac("sha256", settings.adVerificationSecret).update(token).digest("hex");

    return NextResponse.json({
      token,
      signature,
      rewardGold: settings.adRewardGold,
      allowedNetworks: AD_NETWORKS,
      remaining: settings.adDailyLimit - consumedToday
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
