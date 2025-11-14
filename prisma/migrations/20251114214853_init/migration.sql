-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "goldBalance" INTEGER NOT NULL DEFAULT 0,
    "usdBalance" REAL NOT NULL DEFAULT 0,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "farmLastClaimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "goldPurchaseRate" REAL NOT NULL DEFAULT 10,
    "goldWithdrawRate" REAL NOT NULL DEFAULT 20,
    "adDailyLimit" INTEGER NOT NULL DEFAULT 5,
    "adRewardGold" INTEGER NOT NULL DEFAULT 5,
    "farmBaseMultiplier" REAL NOT NULL DEFAULT 1,
    "adVerificationSecret" TEXT NOT NULL DEFAULT 'aurora-secret-token',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NFTTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "goldPerHour" REAL NOT NULL,
    "basePriceGold" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NFTInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NFTInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NFTTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NFTInstance_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rewardGold" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "goldAmount" INTEGER NOT NULL,
    "usdAmount" REAL NOT NULL,
    "note" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoostTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goldCost" INTEGER NOT NULL,
    "multiplier" REAL NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BoostInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "BoostInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BoostTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostInstance_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CosmeticItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goldCost" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CosmeticInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CosmeticInstance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmeticItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CosmeticInstance_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryGold" INTEGER NOT NULL,
    "rewardGold" INTEGER NOT NULL,
    "rewardUsd" REAL NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "BattleParticipation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattleParticipation_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BattleParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "NFTTemplate_name_key" ON "NFTTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AdView_token_key" ON "AdView"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BoostTemplate_name_key" ON "BoostTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticItem_name_key" ON "CosmeticItem"("name");
