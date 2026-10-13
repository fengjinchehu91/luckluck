import { config, defaultRules } from "../config";
import { classifyDice, units } from "../lib/math";
import type {
  AppState,
  CampPool,
  Game,
  HistoryRound,
  Round,
  Rules,
  Tier,
} from "../types";
export const money = (value: string | number) =>
  units(value, config.token.decimals).toString();
export function createRound(game: Game, rules: Rules, at = Date.now()): Round {
  const duration =
    game === "daily" ? config.dailyDuration : config.quickDuration;
  const drawsAt = (Math.floor(at / duration) + 1) * duration;
  const closesAt = drawsAt - (game === "quick" ? config.quickShakeDuration : 0);
  return {
    id: `${game === "daily" ? "D" : "Q"}${Math.floor(drawsAt / duration)}`,
    game,
    closesAt,
    drawsAt,
    stage: at >= closesAt ? "CLOSED" : "OPEN",
    rules: structuredClone(rules),
    result: [],
    serverTime: at,
  };
}
export function seedCamps(): CampPool[] {
  return [
    { camp: "small", funds: money(128450), weight: 148, people: 86 },
    { camp: "triple", funds: money(28600), weight: 34, people: 19 },
    { camp: "big", funds: money(156780), weight: 182, people: 104 },
  ];
}
function seedTiers(): Tier[] {
  return defaultRules.tiers.map((t) => ({
    size: t.size,
    usdt: ((units("128640.50", 6) * BigInt(t.shareBps)) / 10000n).toString(),
    luck: ((BigInt(money(48650000)) * BigInt(t.shareBps)) / 10000n).toString(),
    weight: 0,
  }));
}
function seedHistory(): HistoryRound[] {
  const records: HistoryRound[] = [];
  for (const game of ["daily", "quick"] as Game[])
    for (let i = 0; i < 24; i++) {
      const duration =
        game === "daily" ? config.dailyDuration : config.quickDuration;
      const at = Math.floor(Date.now() / duration) * duration - i * duration;
      const result =
        game === "daily"
          ? [3, 6, 9, 12, 15, 18]
              .map((n) => (n + i * 3) % 20)
              .sort((a, b) => a - b)
          : i % 7 === 4
            ? [3, 3, 3]
            : [3 + (i % 3), 2 + (i % 4), 6 - (i % 5)];
      const tiers = seedTiers().map((t) => ({
        size: t.size,
        releasedUsdt: ((BigInt(t.usdt) * 6n) / 10n).toString(),
        releasedLuck: ((BigInt(t.luck) * 6n) / 10n).toString(),
        rolledUsdt: ((BigInt(t.usdt) * 4n) / 10n).toString(),
        rolledLuck: ((BigInt(t.luck) * 4n) / 10n).toString(),
        weight: t.size * (i + 1),
      }));
      const camps = seedCamps(),
        losing = camps
          .filter(
            (c) =>
              c.camp !== (game === "quick" ? classifyDice(result) : "small"),
          )
          .reduce((a, c) => a + BigInt(c.funds), 0n);
      records.push({
        id: `${game === "daily" ? "D" : "Q"}${Math.floor(at / duration)}`,
        game,
        at,
        result,
        stage: "SETTLED",
        ruleVersion: "1.0.0",
        releaseLuck:
          game === "daily"
            ? tiers.reduce((a, t) => a + BigInt(t.releasedLuck), 0n).toString()
            : (
                camps.reduce((a, c) => a + BigInt(c.funds), 0n) -
                (losing * 2n) / 100n
              ).toString(),
        releaseUsdt: game === "daily" ? units("77184.30", 6).toString() : "0",
        rolledLuck: game === "daily" ? money(19460000) : "0",
        burn:
          game === "daily"
            ? money(14200 + i * 123)
            : ((losing * 2n) / 100n).toString(),
        tiers: game === "daily" ? tiers : undefined,
        camps: game === "quick" ? camps : undefined,
        demoId: `DEMO-${game}-${i + 1}`,
      });
    }
  return records.sort((a, b) => b.at - a.at);
}
export function initialState(): AppState {
  return {
    rules: structuredClone(defaultRules),
    daily: createRound("daily", defaultRules),
    quick: createRound("quick", defaultRules),
    tiers: seedTiers(),
    camps: seedCamps(),
    orders: [],
    history: seedHistory(),
    wallet: {
      connected: false,
      address: "DEMO-LUCK-WALLET-0001",
      chainId: config.network.chainId,
      balance: money(250000),
      usdt: "0",
      approved: false,
    },
    stats: {
      participants: 284691,
      usdtPaid: units("2486590.75", 6).toString(),
      luckPaid: money(186542000),
      luckBurned: money(42861500),
    },
    ledger: [],
  };
}
