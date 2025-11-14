export type NFTRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export type TransactionType =
  | "PURCHASE_GOLD"
  | "WITHDRAW_GOLD"
  | "BUY_NFT"
  | "FARM_REWARD"
  | "AD_REWARD"
  | "BUY_ENERGY"
  | "BUY_BOOST"
  | "BATTLE_ENTRY"
  | "BATTLE_REWARD"
  | "BUY_BOX"
  | "BUY_COSMETIC"
  | "ADMIN_ADJUSTMENT";

export type UserPayload = {
  id: string;
  username: string;
  displayName: string;
  goldBalance: number;
  usdBalance: number;
  energy: number;
  farmLastClaimedAt: string;
  nfts: {
    id: string;
    acquiredAt: string;
    template: {
      id: number;
      name: string;
      rarity: NFTRarity;
      goldPerHour: number;
      basePriceGold: number;
      imageUrl: string;
      description: string;
    };
  }[];
  boosts: {
    id: string;
    activatedAt: string;
    expiresAt: string;
    template: {
      id: number;
      name: string;
      description: string;
      multiplier: number;
      durationHours: number;
    };
  }[];
  cosmetics: {
    id: string;
    acquiredAt: string;
    item: {
      id: number;
      name: string;
      description: string;
      imageUrl: string;
      goldCost: number;
    };
  }[];
};

export type SettingsPayload = {
  goldPurchaseRate: number;
  goldWithdrawRate: number;
  adDailyLimit: number;
  adRewardGold: number;
  farmBaseMultiplier: number;
};

export type FarmPayload = {
  gold: number;
  hours: number;
  minutes: number;
  baseRate: number;
};

export type TransactionPayload = {
  id: string;
  type: TransactionType;
  goldAmount: number;
  usdAmount: number;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    displayName: string;
  } | null;
};

export type PlayerResponse = {
  user: UserPayload;
  settings: SettingsPayload;
  farm: FarmPayload;
  adViewsToday: number;
  transactions: TransactionPayload[];
};
