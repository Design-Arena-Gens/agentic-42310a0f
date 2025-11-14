import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  const templates = await prisma.nFTTemplate.findMany({
    orderBy: [{ rarity: "asc" }, { basePriceGold: "asc" }]
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const templateId = Number(data?.templateId);

    if (!templateId) {
      return NextResponse.json({ error: "INVALID_TEMPLATE" }, { status: 400 });
    }

    const template = await prisma.nFTTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    if (user.goldBalance < template.basePriceGold) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const usdAmount = goldToUsd(template.basePriceGold, settings.goldWithdrawRate);

    await prisma.nFTInstance.create({
      data: {
        ownerId: user.id,
        templateId: template.id
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: template.basePriceGold }
      },
      include: {
        nfts: { include: { template: true } },
        boosts: { include: { template: true } },
        cosmetics: { include: { item: true } }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BUY_NFT",
        goldAmount: -template.basePriceGold,
        usdAmount,
        metadata: JSON.stringify({ templateId: template.id })
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
