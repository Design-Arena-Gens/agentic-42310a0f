import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  const boosts = await prisma.boostTemplate.findMany({
    orderBy: { goldCost: "asc" }
  });
  return NextResponse.json({ boosts });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const templateId = Number(data?.templateId);

    if (!templateId) {
      return NextResponse.json({ error: "INVALID_TEMPLATE" }, { status: 400 });
    }

    const template = await prisma.boostTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    if (user.goldBalance < template.goldCost) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + template.durationHours * 60 * 60 * 1000);
    const usdAmount = goldToUsd(template.goldCost, settings.goldWithdrawRate);

    await prisma.boostInstance.create({
      data: {
        ownerId: user.id,
        templateId: template.id,
        activatedAt: new Date(),
        expiresAt
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: template.goldCost }
      }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BUY_BOOST",
        goldAmount: -template.goldCost,
        usdAmount,
        metadata: JSON.stringify({ templateId: template.id, expiresAt })
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
