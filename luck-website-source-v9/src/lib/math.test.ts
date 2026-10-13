import { describe, expect, it } from "vitest";
import { defaultRules } from "../config";
import {
  choose,
  classifyDice,
  convertU,
  dailyRelease,
  quickEstimate,
  settleQuick,
  ticketInfo,
  units,
  validateRules,
  winningWeight,
} from "./math";
import type { CampPool, Ticket } from "../types";
const ticket = (
  numbers: number[],
  mode = "normal",
  multiplier = 1,
): Ticket => ({ game: "daily", mode, numbers, multiplier });
describe("daily ticket combinations", () => {
  it("accepts both endpoints 0 and 19 and rejects numbers outside the 20-number wheel", () => {
    expect(ticketInfo(ticket([0, 19]), defaultRules).size).toBe(2);
    expect(winningWeight([0, 19], [0, 3, 6, 9, 12, 19], 2, 3)).toBe(3);
    for (const nums of [
      [-1, 3],
      [0, 20],
      [0, 0],
      [0.5, 19],
    ])
      expect(() => ticketInfo(ticket(nums), defaultRules)).toThrow();
  });
  it("requires all selected numbers; ordinary play does not stack tiers", () => {
    expect(winningWeight([1, 2, 3], [1, 2, 4, 5, 6, 7], 3, 2)).toBe(0);
    expect(winningWeight([1, 2, 3], [1, 2, 3, 5, 6, 7], 3, 2)).toBe(2);
  });
  it("decomposes packages using C(h,k) multiplied by the locked multiplier", () => {
    expect(winningWeight([1, 2, 3], [1, 2, 3, 4, 5, 6], 2, 3)).toBe(9);
    expect(winningWeight([1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6], 6, 2)).toBe(
      2,
    );
  });
  it("allows seven only for 7包6 and charges seven bets", () => {
    const nums = [1, 2, 3, 4, 5, 6, 7];
    expect(ticketInfo(ticket(nums, "7包6"), defaultRules)).toEqual({
      bets: 7,
      size: 6,
      weight: 7,
    });
    expect(() => ticketInfo(ticket(nums), defaultRules)).toThrow();
    expect(() => ticketInfo(ticket([1, 1]), defaultRules)).toThrow();
    expect(choose(7, 6)).toBe(7);
  });
  it("rejects fractional, negative and unsafe multipliers", () => {
    for (const m of [0, -1, 1.1, NaN, Infinity])
      expect(() =>
        ticketInfo(ticket([1, 2], "normal", m), defaultRules),
      ).toThrow();
  });
});
describe("exact token amounts", () => {
  it("converts U via configured decimals and always rounds up", () => {
    expect(convertU("1", "0.001", 18)).toBe(units("1000"));
    expect(convertU("1", "0.01", 18)).toBe(units("100"));
    expect(convertU("1", "3", 2)).toBe(34n);
    expect(convertU("7", "0.00128", 18)).toBe(units("5468.75"));
  });
  it("refuses invalid or missing quotes", () => {
    expect(() => convertU("1", "0", 18)).toThrow();
    expect(() => units("-1")).toThrow();
  });
});
describe("draw classification", () => {
  it("gives triples precedence including 111 and 666", () => {
    expect(classifyDice([1, 1, 1])).toBe("triple");
    expect(classifyDice([6, 6, 6])).toBe("triple");
    expect(classifyDice([1, 3, 6])).toBe("small");
    expect(classifyDice([1, 4, 6])).toBe("big");
  });
});
describe("pool conservation", () => {
  it("daily releases accumulated balance; rounding remainder remains in the same tier", () => {
    const r = dailyRelease(101n, [1, 2]);
    expect(r.paid).toEqual([20n, 40n]);
    expect(r.rollover).toBe(41n);
    expect(r.released + r.rollover).toBe(101n);
    expect(dailyRelease(101n, []).rollover).toBe(101n);
  });
  it("retains both release-budget dust and payout dust", () => {
    const r = dailyRelease(101n, [1, 1, 1, 1, 1, 1, 1]);
    expect(r.released).toBe(56n);
    expect(r.rollover).toBe(45n);
  });
  it("quick burns net profit only and uses locked U weights even if quotes differ", () => {
    const p = quickEstimate(1000n, 2, 4, 1000n)!;
    expect(p).toEqual({
      principal: 1000n,
      profit: 500n,
      burn: 10n,
      payout: 1490n,
    });
    const other = quickEstimate(2000n, 2, 4, 1000n)!;
    expect(other.profit).toBe(p.profit);
    expect(other.payout).toBe(2490n);
  });
  it("holds unfunded winning camp for review and never invents payouts", () => {
    const pools: CampPool[] = [
      { camp: "small", funds: "50", weight: 1, people: 1 },
      { camp: "triple", funds: "0", weight: 0, people: 0 },
      { camp: "big", funds: "60", weight: 1, people: 1 },
    ];
    expect(settleQuick(pools, "triple", []).status).toBe("NEEDS_REVIEW");
    expect(quickEstimate(10n, 1, 0, 0n)).toBeNull();
  });
  it("quick payouts plus burn plus retained dust exactly equal all funds", () => {
    const pools: CampPool[] = [
      { camp: "small", funds: "300", weight: 3, people: 2 },
      { camp: "triple", funds: "27", weight: 1, people: 1 },
      { camp: "big", funds: "74", weight: 1, people: 1 },
    ];
    const result = settleQuick(pools, "small", [
      { principal: 100n, weight: 1 },
      { principal: 200n, weight: 2 },
    ]);
    expect(
      result.payouts.reduce((a, p) => a + p.payout, 0n) +
        result.burned +
        result.retained,
    ).toBe(401n);
    expect(result.retained).toBe(1n);
  });
});
describe("configuration validation", () => {
  it("rejects invalid tier sums, duplicate packages and unconfirmed policy changes", () => {
    expect(validateRules(defaultRules)).toBe(defaultRules);
    expect(() =>
      validateRules({
        ...defaultRules,
        tiers: defaultRules.tiers.map((t) => ({ ...t, shareBps: 100 })),
      }),
    ).toThrow();
    expect(() =>
      validateRules({
        ...defaultRules,
        packages: Array(5).fill({ choose: 3, size: 2, bets: 3 }),
      }),
    ).toThrow();
    expect(() =>
      validateRules({ ...defaultRules, unfundedOutcomePolicy: "REFUND" }),
    ).toThrow();
  });
});
