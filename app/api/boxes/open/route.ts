import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { goldToUsd } from "@/lib/game";

export const dynamic = "force-dynamic";

type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

type Reward =
  | { type: "gold"; min: number; max: number; weight: number }
  | { type: "energy"; amount: number; weight: number }
  | { type: "nft"; rarity: Rarity; weight: number }
  | { type: "boost"; weight: number };

type BoxConfig = {
  costGold: number;
  rewards: Reward[];
};

const BOX_CONFIG: Record<string, BoxConfig> = {
  bronze: {
    costGold: 80,
    rewards: [
      { type: "gold", min: 40, max: 160, weight: 40 },
      { type: "energy", amount: 120, weight: 30 },
      { type: "nft", rarity: "COMMON", weight: 20 },
      { type: "boost", weight: 10 }
    ]
  },
  silver: {
    costGold: 180,
    rewards: [
      { type: "gold", min: 120, max: 360, weight: 35 },
      { type: "energy", amount: 240, weight: 25 },
      { type: "nft", rarity: "RARE", weight: 20 },
      { type: "nft", rarity: "EPIC", weight: 10 },
      { type: "boost", weight: 10 }
    ]
  },
  gold: {
    costGold: 420,
    rewards: [
      { type: "gold", min: 260, max: 760, weight: 30 },
      { type: "energy", amount: 400, weight: 20 },
      { type: "nft", rarity: "EPIC", weight: 20 },
      { type: "nft", rarity: "LEGENDARY", weight: 10 },
      { type: "boost", weight: 20 }
    ]
  }
};

function pickReward(rewards: Reward[]) {
  const totalWeight = rewards.reduce((acc, reward) => acc + reward.weight, 0);
  const value = Math.random() * totalWeight;
  let current = 0;
  for (const reward of rewards) {
    current += reward.weight;
    if (value <= current) {
      return reward;
    }
  }
  return rewards[0];
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    const box = String(data?.box ?? "bronze").toLowerCase();
    const config = BOX_CONFIG[box] ?? BOX_CONFIG.bronze;

    if (user.goldBalance < config.costGold) {
      return NextResponse.json({ error: "INSUFFICIENT_GOLD" }, { status: 400 });
    }

    const settings = await prisma.adminSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "SETTINGS_NOT_FOUND" }, { status: 500 });
    }

    const usdAmount = goldToUsd(config.costGold, settings.goldWithdrawRate);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        goldBalance: { decrement: config.costGold }
      }
    });

    const reward = pickReward(config.rewards);
    const rewardSummary: Record<string, unknown> = { type: reward.type };

    if (reward.type === "gold") {
      const goldReward = Math.floor(
        reward.min + Math.random() * (reward.max - reward.min)
      );
      const usdReward = goldToUsd(goldReward, settings.goldWithdrawRate);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          goldBalance: { increment: goldReward },
          usdBalance: { increment: usdReward }
        }
      });
      rewardSummary.gold = goldReward;
      rewardSummary.usd = usdReward;
    } else if (reward.type === "energy") {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          energy: { increment: reward.amount }
        }
      });
      if (updated.energy > 500) {
        await prisma.user.update({
          where: { id: user.id },
          data: { energy: 500 }
        });
      }
      rewardSummary.energy = reward.amount;
    } else if (reward.type === "nft") {
      const template = await prisma.nFTTemplate.findFirst({
        where: { rarity: reward.rarity },
        orderBy: { goldPerHour: "desc" }
      });
      if (template) {
        await prisma.nFTInstance.create({
          data: {
            ownerId: user.id,
            templateId: template.id
          }
        });
        rewardSummary.nftTemplateId = template.id;
        rewardSummary.nftName = template.name;
      } else {
        rewardSummary.type = "gold";
        const fallbackGold = 100;
        const usdReward = goldToUsd(fallbackGold, settings.goldWithdrawRate);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            goldBalance: { increment: fallbackGold },
            usdBalance: { increment: usdReward }
          }
        });
        rewardSummary.gold = fallbackGold;
        rewardSummary.usd = usdReward;
      }
    } else if (reward.type === "boost") {
      const boostTemplate = await prisma.boostTemplate.findFirst({
        orderBy: { multiplier: "desc" }
      });
      if (boostTemplate) {
        await prisma.boostInstance.create({
          data: {
            ownerId: user.id,
            templateId: boostTemplate.id,
            activatedAt: new Date(),
            expiresAt: new Date(Date.now() + boostTemplate.durationHours * 60 * 60 * 1000)
          }
        });
        rewardSummary.boostTemplateId = boostTemplate.id;
        rewardSummary.boostName = boostTemplate.name;
      }
    }

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BUY_BOX",
        goldAmount: -config.costGold,
        usdAmount,
        metadata: JSON.stringify({ box, reward: rewardSummary })
      }
    });

    return NextResponse.json({ reward: rewardSummary, box });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
