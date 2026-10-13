import type { Camp, CampPool, Rules, Ticket } from "../types";
export function units(value: string | number, decimals = 18): bigint {
  const s = String(value);
  if (!/^\d+(\.\d+)?$/.test(s) || decimals < 0 || decimals > 36)
    throw new Error("金额格式不正确");
  const [whole, fraction = ""] = s.split(".");
  if (fraction.length > decimals)
    throw new Error(`金额最多支持 ${decimals} 位小数`);
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0") || "0")
  );
}
export function decimal(
  amount: string | bigint,
  decimals = 18,
  digits = 2,
): string {
  const n = BigInt(amount),
    base = 10n ** BigInt(decimals),
    negative = n < 0n,
    abs = negative ? -n : n;
  const whole = (abs / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = (abs % base)
    .toString()
    .padStart(decimals, "0")
    .slice(0, Math.min(digits, decimals));
  return `${negative ? "-" : ""}${whole}${fraction ? "." + fraction : ""}`;
}
export function rawDecimal(amount: bigint, decimals = 6) {
  const s = amount.toString().padStart(decimals + 1, "0");
  return `${s.slice(0, -decimals)}.${s.slice(-decimals)}`;
}
export function convertU(u: string, price: string, decimals: number): bigint {
  const a = units(u, 6),
    p = units(price, 6);
  if (p <= 0n) throw new Error("暂无可用报价");
  return (a * 10n ** BigInt(decimals) + p - 1n) / p;
}
export function choose(n: number, k: number): number {
  if (n < k || k < 0) return 0;
  let x = 1;
  for (let i = 1; i <= k; i++) x = (x * (n - i + 1)) / i;
  return Math.round(x);
}
export function ticketInfo(ticket: Ticket, rules: Rules) {
  if (
    !Number.isSafeInteger(ticket.multiplier) ||
    ticket.multiplier < 1 ||
    ticket.multiplier > 1_000_000
  )
    throw new Error("倍数必须为 1–1,000,000 的整数");
  if (ticket.game === "quick") {
    if (
      ticket.chips &&
      (!ticket.chips.length ||
        ticket.chips.some(
          (c) =>
            ![1, 5, 10, 50].includes(c.value) ||
            !Number.isSafeInteger(c.count) ||
            c.count < 1,
        ) ||
        ticket.chips.reduce((sum, c) => sum + c.value * c.count, 0) !==
          ticket.multiplier)
    )
      throw new Error("筹码数量与参与倍数不一致");
    if (!["small", "triple", "big"].includes(ticket.camp || ""))
      throw new Error("请选择一个阵营");
    return { bets: 1, size: 0, weight: ticket.multiplier };
  }
  const nums = ticket.numbers;
  if (
    new Set(nums).size !== nums.length ||
    nums.some((n) => !Number.isInteger(n) || n < 0 || n > 19)
  )
    throw new Error("号码须为 0–19 之间的不重复整数");
  if (ticket.mode === "normal") {
    if (nums.length < 2 || nums.length > 6)
      throw new Error("普通玩法请选择 2–6 个号码");
    return { bets: 1, size: nums.length, weight: ticket.multiplier };
  }
  const pack = rules.packages.find(
    (p) => `${p.choose}包${p.size}` === ticket.mode,
  );
  if (!pack || nums.length !== pack.choose)
    throw new Error(`请为 ${ticket.mode} 选择完整号码`);
  return {
    bets: choose(pack.choose, pack.size),
    size: pack.size,
    weight: pack.bets * ticket.multiplier,
  };
}
export function winningWeight(
  numbers: number[],
  result: number[],
  size: number,
  multiplier: number,
): number {
  return (
    choose(numbers.filter((n) => result.includes(n)).length, size) * multiplier
  );
}
export function classifyDice(dice: number[]): Camp {
  if (
    dice.length !== 3 ||
    dice.some((n) => !Number.isInteger(n) || n < 1 || n > 6)
  )
    throw new Error("骰子点数不正确");
  if (dice.every((n) => n === dice[0])) return "triple";
  return dice.reduce((a, b) => a + b, 0) >= 11 ? "big" : "small";
}
export function dailyRelease(balance: bigint, weights: number[], bps = 6000) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (!total)
    return { paid: weights.map(() => 0n), released: 0n, rollover: balance };
  const budget = (balance * BigInt(bps)) / 10000n;
  const paid = weights.map((w) => (budget * BigInt(w)) / BigInt(total));
  const released = paid.reduce((a, b) => a + b, 0n);
  return { paid, released, rollover: balance - released };
}
export function quickEstimate(
  principal: bigint,
  weight: number,
  winnerWeight: number,
  losers: bigint,
  burnBps = 200,
) {
  if (winnerWeight <= 0 || weight <= 0) return null;
  const profit = (losers * BigInt(weight)) / BigInt(winnerWeight),
    burn = (profit * BigInt(burnBps)) / 10000n;
  return { principal, profit, burn, payout: principal + profit - burn };
}
export function settleQuick(
  pools: CampPool[],
  winner: Camp,
  winners: { principal: bigint; weight: number }[],
  burnBps = 200,
) {
  const camp = pools.find((p) => p.camp === winner)!;
  if (!camp || camp.weight === 0)
    return {
      status: "NEEDS_REVIEW" as const,
      payouts: [],
      retained: 0n,
      burned: 0n,
    };
  const losing = pools
    .filter((p) => p.camp !== winner)
    .reduce((a, p) => a + BigInt(p.funds), 0n);
  const payouts = winners.map((p) =>
    quickEstimate(p.principal, p.weight, camp.weight, losing, burnBps)!,
  );
  return {
    status: "SETTLED" as const,
    payouts,
    retained: losing - payouts.reduce((a, p) => a + p.profit, 0n),
    burned: payouts.reduce((a, p) => a + p.burn, 0n),
  };
}
export function validateRules(value: unknown): Rules {
  const r = value as Rules;
  if (!r || typeof r !== "object") throw new Error("配置必须为 JSON 对象");
  if (!/^\d+\.\d+\.\d+$/.test(r.version)) throw new Error("规则版本须为 x.y.z");
  if (
    !Number.isFinite(Date.parse(r.effectiveAt)) ||
    !Number.isFinite(Date.parse(r.updatedAt)) ||
    r.effectiveRound !== "NEXT"
  )
    throw new Error("日期格式不正确，生效期次必须为 NEXT");
  if (units(r.price, 6) <= 0n || units(r.unitU, 6) <= 0n)
    throw new Error("报价与每注 U 金额必须大于零");
  for (const v of [r.dailyBurnBps, r.releaseBps, r.quickBurnBps])
    if (!Number.isInteger(v) || v < 0 || v > 10000)
      throw new Error("比例须为 0–10000 的基点整数");
  if (
    !Array.isArray(r.tiers) ||
    r.tiers.length !== 5 ||
    new Set(r.tiers.map((t) => t.size)).size !== 5 ||
    r.tiers.some(
      (t) =>
        ![2, 3, 4, 5, 6].includes(t.size) ||
        !Number.isInteger(t.shareBps) ||
        t.shareBps < 0,
    ) ||
    r.tiers.reduce((a, t) => a + t.shareBps, 0) !== 10000
  )
    throw new Error("五档比例必须合计 100%");
  if (
    !Array.isArray(r.packages) ||
    r.packages.length !== 5 ||
    new Set(r.packages.map((p) => p.choose)).size !== 5 ||
    r.packages.some(
      (p) =>
        ![3, 4, 5, 6, 7].includes(p.choose) ||
        p.size !== p.choose - 1 ||
        p.bets !== choose(p.choose, p.size),
    )
  )
    throw new Error("复式组合或注数不合法");
  if (
    r.quickWeight !== "MULTIPLIER" ||
    r.unfundedOutcomePolicy !== "UNCONFIRMED"
  )
    throw new Error("此版本仅支持倍数权重；空胜阵营处理必须保持 UNCONFIRMED");
  if (typeof r.logoPath !== "string" || !r.logoPath.startsWith("/assets/"))
    throw new Error("品牌素材须放在 /assets/ 目录");
  return r;
}
