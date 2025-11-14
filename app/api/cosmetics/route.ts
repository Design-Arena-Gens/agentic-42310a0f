import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  const cosmetics = await prisma.cosmeticItem.findMany({
    orderBy: { goldCost: "asc" }
  });
  return NextResponse.json({ cosmetics });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const itemId = Number(data?.itemId);

    if (!itemId) {
      return NextResponse.json({ error: "INVALID_ITEM" }, { status: 400 });
    }

    const item = await prisma.cosmeticItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });
    }

    const alreadyOwned = await prisma.cosmeticInstance.findFirst({
      where: { ownerId: user.id, itemId: item.id }
    });

    if (alreadyOwned) {
      return NextResponse.json({ error: "ALREADY_OWNED" }, { status: 400 });
    }

    if (user.goldBalance < item.goldCost) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const usdAmount = goldToUsd(item.goldCost, settings.goldWithdrawRate);

    await prisma.cosmeticInstance.create({
      data: {
        ownerId: user.id,
        itemId: item.id
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: item.goldCost }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BUY_COSMETIC",
        goldAmount: -item.goldCost,
        usdAmount,
        metadata: JSON.stringify({ itemId: item.id })
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
