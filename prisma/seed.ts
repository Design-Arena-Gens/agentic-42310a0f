import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.adminSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      goldPurchaseRate: 10,
      goldWithdrawRate: 20,
      adDailyLimit: 8,
      adRewardGold: 5,
      farmBaseMultiplier: 1,
      adVerificationSecret: "aurora-secret-token"
    }
  });

  const nftTemplates = [
    {
      name: "Sentinela Comum",
      rarity: "COMMON",
      goldPerHour: 2,
      basePriceGold: 120,
      description: "Uma unidade básica para começar a farmar GOLD.",
      imageUrl: "/assets/nfts/common-sentinel.svg"
    },
    {
      name: "Guardião Raro",
      rarity: "RARE",
      goldPerHour: 6,
      basePriceGold: 320,
      description: "Um guardião raro com taxa de farm superior.",
      imageUrl: "/assets/nfts/rare-guardian.svg"
    },
    {
      name: "Arcanista Épico",
      rarity: "EPIC",
      goldPerHour: 15,
      basePriceGold: 900,
      description: "Domina a energia arcana para elevar o farm.",
      imageUrl: "/assets/nfts/epic-chanter.svg"
    },
    {
      name: "Dragão Lendário",
      rarity: "LEGENDARY",
      goldPerHour: 35,
      basePriceGold: 2000,
      description: "Uma criatura lendária com produção massiva de GOLD.",
      imageUrl: "/assets/nfts/legendary-dragon.svg"
    },
    {
      name: "Titã Mítico",
      rarity: "MYTHIC",
      goldPerHour: 70,
      basePriceGold: 4200,
      description: "O ápice do farm, concedendo quantidades absurdas de GOLD.",
      imageUrl: "/assets/nfts/mythic-titan.svg"
    }
  ];

  for (const template of nftTemplates) {
    await prisma.nFTTemplate.upsert({
      where: { name: template.name },
      update: { ...template },
      create: template
    });
  }

  const boosts = [
    {
      name: "Catalisador de Farm",
      description: "Multiplica o farm de GOLD em 2x por 6h.",
      goldCost: 250,
      multiplier: 2,
      durationHours: 6
    },
    {
      name: "Overclock de Energia",
      description: "Reduz em 50% o custo de energia em batalhas por 12h.",
      goldCost: 180,
      multiplier: 1.5,
      durationHours: 12
    }
  ];

  for (const boost of boosts) {
    await prisma.boostTemplate.upsert({
      where: { name: boost.name },
      update: { ...boost },
      create: boost
    });
  }

  const cosmetics = [
    {
      name: "Aura Neon",
      description: "Deixa seu avatar com um efeito neon vibrante.",
      goldCost: 80,
      imageUrl: "/assets/cosmetics/neon-aura.svg"
    },
    {
      name: "Manto Celestial",
      description: "Veste o herói com um manto azul estelar.",
      goldCost: 140,
      imageUrl: "/assets/cosmetics/celestial-cloak.svg"
    }
  ];

  for (const cosmetic of cosmetics) {
    await prisma.cosmeticItem.upsert({
      where: { name: cosmetic.name },
      update: { ...cosmetic },
      create: cosmetic
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
