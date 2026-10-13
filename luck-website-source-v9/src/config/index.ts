import type { Rules } from "../types";
const e = import.meta.env;
export const DAILY_NUMBERS = Array.from({ length: 20 }, (_, n) => n);
export const TOKEN_LOGO = "/assets/luck-token-logo.jpg";
export const config = {
  mode: e.VITE_SERVICE_MODE || "mock",
  brand: "luck",
  symbol: "LUCK",
  network: {
    name: "BNB Chain",
    chainId: Number(e.VITE_CHAIN_ID || 56),
    rpc: e.VITE_RPC_URL || "",
    explorer: e.VITE_EXPLORER_URL || "https://bscscan.com",
  },
  token: {
    address: e.VITE_TOKEN_ADDRESS || "",
    decimals: Number(e.VITE_TOKEN_DECIMALS || 18),
  },
  contracts: {
    daily: e.VITE_DAILY_CONTRACT_ADDRESS || "",
    quick: e.VITE_QUICK_CONTRACT_ADDRESS || "",
  },
  api: e.VITE_API_URL || "",
  quoteLifetime: 60_000,
  quickDuration: 180_000,
  quickShakeDuration: 10_000,
  dailyDuration: 86_400_000,
};
export const defaultRules: Rules = {
  version: "1.0.0",
  effectiveAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-10-11T00:00:00.000Z",
  effectiveRound: "NEXT",
  price: "0.00128",
  unitU: "1",
  dailyBurnBps: 4000,
  releaseBps: 6000,
  quickBurnBps: 200,
  tiers: [
    { size: 6, shareBps: 4500 },
    { size: 5, shareBps: 2500 },
    { size: 4, shareBps: 1600 },
    { size: 3, shareBps: 900 },
    { size: 2, shareBps: 500 },
  ],
  packages: [3, 4, 5, 6, 7].map((choose) => ({
    choose,
    size: choose - 1,
    bets: choose,
  })),
  quickWeight: "MULTIPLIER",
  unfundedOutcomePolicy: "UNCONFIRMED",
  logoPath: TOKEN_LOGO,
};
export const campLabels = { small: "小", triple: "豹子", big: "大" };
export const stageLabels = {
  OPEN: "参与进行中",
  CLOSED: "已截止",
  RANDOMNESS_PENDING: "等待随机数",
  DRAWN: "已开奖",
  SETTLING: "结算中",
  SETTLED: "已结算",
  NEEDS_REVIEW: "待处理",
};
