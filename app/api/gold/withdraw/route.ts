import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const goldAmount = Number(data?.goldAmount ?? 0);

    if (!goldAmount || goldAmount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    if (user.goldBalance < goldAmount) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    const usdAmount = goldToUsd(goldAmount, settings.goldWithdrawRate);

    const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!freshUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (freshUser.usdBalance < usdAmount) {
      return NextResponse.json({ error: "INSUFFICIENT_USD" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: goldAmount },
        usdBalance: { decrement: usdAmount }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAW_GOLD",
        goldAmount: -goldAmount,
        usdAmount: usdAmount,
        note: "Solicitação de saque"
      }
    });

    return NextResponse.json({ usdAmount, user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
