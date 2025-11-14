import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

const PACKAGES = {
  small: { goldCost: 40, energy: 80 },
  medium: { goldCost: 90, energy: 200 },
  large: { goldCost: 180, energy: 450 }
} as const;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const pkgKey = String(data?.package ?? "small") as keyof typeof PACKAGES;
    const pkg = PACKAGES[pkgKey] ?? PACKAGES.small;

    if (user.goldBalance < pkg.goldCost) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const usdAmount = goldToUsd(pkg.goldCost, settings.goldWithdrawRate);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: pkg.goldCost },
        energy: { increment: pkg.energy }
      }
    });

    let finalUser = updatedUser;
    if (updatedUser.energy > 500) {
      finalUser = await prisma.user.update({
        where: { id: user.id },
        data: { energy: 500 }
      });
    }

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BUY_ENERGY",
        goldAmount: -pkg.goldCost,
        usdAmount,
        metadata: JSON.stringify({ package: pkgKey })
      }
    });

    return NextResponse.json({ user: finalUser, package: pkgKey });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
