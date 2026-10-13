export type Game = "daily" | "quick";
export type Camp = "small" | "triple" | "big";
export type Stage =
  | "OPEN"
  | "CLOSED"
  | "RANDOMNESS_PENDING"
  | "DRAWN"
  | "SETTLING"
  | "SETTLED"
  | "NEEDS_REVIEW";
export interface Rules {
  version: string;
  effectiveAt: string;
  updatedAt: string;
  effectiveRound: string;
  price: string;
  unitU: string;
  dailyBurnBps: number;
  releaseBps: number;
  quickBurnBps: number;
  tiers: { size: number; shareBps: number }[];
  packages: { choose: number; size: number; bets: number }[];
  quickWeight: "MULTIPLIER";
  unfundedOutcomePolicy: "UNCONFIRMED";
  logoPath: string;
}
export interface Round {
  id: string;
  game: Game;
  closesAt: number;
  drawsAt: number;
  stage: Stage;
  rules: Rules;
  result: number[];
  resultAt?: number;
  serverTime: number;
}
export interface Tier {
  size: number;
  usdt: string;
  luck: string;
  weight: number;
}
export interface CampPool {
  camp: Camp;
  funds: string;
  weight: number;
  people: number;
}
export interface Quote {
  quoteId: string;
  game: Game;
  roundId: string;
  ruleVersion: string;
  uAmount: string;
  price: string;
  tokenAmount: string;
  quotedAt: number;
  expiresAt: number;
  priceSource: string;
}
export interface Ticket {
  game: Game;
  mode: string;
  numbers: number[];
  camp?: Camp;
  multiplier: number;
  chips?: { value: number; count: number }[];
}
export interface Order extends Ticket {
  id: string;
  roundId: string;
  ruleVersion: string;
  quoteId: string;
  price: string;
  uAmount: string;
  paid: string;
  weight: number;
  betCount: number;
  size: number;
  createdAt: number;
  status: "PENDING" | "CLAIMABLE" | "CLAIMED" | "LOST" | "NEEDS_REVIEW";
  rewardLuck: string;
  rewardUsdt: string;
  principal: string;
  profit: string;
  burn: string;
}
export interface TierSettlement {
  size: number;
  releasedUsdt: string;
  releasedLuck: string;
  rolledUsdt: string;
  rolledLuck: string;
  weight: number;
}
export interface HistoryRound {
  id: string;
  game: Game;
  at: number;
  result: number[];
  stage: Stage;
  ruleVersion: string;
  releaseLuck: string;
  releaseUsdt: string;
  rolledLuck: string;
  burn: string;
  tiers?: TierSettlement[];
  camps?: CampPool[];
  demoId: string;
}
export interface AppState {
  rules: Rules;
  daily: Round;
  quick: Round;
  tiers: Tier[];
  camps: CampPool[];
  orders: Order[];
  history: HistoryRound[];
  wallet: {
    connected: boolean;
    address: string;
    chainId: number;
    balance: string;
    usdt: string;
    approved: boolean;
  };
  stats: {
    participants: number;
    usdtPaid: string;
    luckPaid: string;
    luckBurned: string;
  };
  ledger: {
    id: string;
    description: string;
    amount: string;
    unit: string;
    at: number;
  }[];
}
