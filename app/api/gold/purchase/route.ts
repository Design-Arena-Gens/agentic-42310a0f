import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { usdToGold } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const usdAmount = Number(data?.usdAmount ?? 0);

    if (!usdAmount || usdAmount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const goldAmount = usdToGold(usdAmount, settings.goldPurchaseRate);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { increment: goldAmount }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "PURCHASE_GOLD",
        goldAmount,
        usdAmount,
        note: "Compra de GOLD via painel"
      }
    });

    return NextResponse.json({ goldAmount, user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
