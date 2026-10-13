import { config } from "../config";
import {
  choose,
  classifyDice,
  convertU,
  dailyRelease,
  rawDecimal,
  settleQuick,
  ticketInfo,
  units,
  validateRules,
  winningWeight,
} from "../lib/math";
import type {
  AppState,
  Game,
  HistoryRound,
  Order,
  Quote,
  Rules,
  Ticket,
  TierSettlement,
} from "../types";
import { createRound, initialState, seedCamps } from "./seed";
const KEY = "luck-preview-v1";
const pause = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const id = (kind: string) => `DEMO-${kind}-${crypto.randomUUID().slice(0, 8)}`;
function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      validateRules(s.rules);
      if (s.daily && s.quick && s.wallet && Array.isArray(s.orders)) {
        if (
          (s.quick.stage === "OPEN" || s.quick.stage === "CLOSED") &&
          s.quick.drawsAt - s.quick.closesAt !== config.quickShakeDuration
        ) {
          if (s.quick.stage === "OPEN")
            s.quick.closesAt = s.quick.drawsAt - config.quickShakeDuration;
          else if (s.quick.stage === "CLOSED")
            s.quick.drawsAt = s.quick.closesAt + config.quickShakeDuration;
          localStorage.setItem(KEY, JSON.stringify(s));
        }
        return s;
      }
    }
  } catch {
    /* A damaged demo cache starts a fresh demo, never a real transaction. */
  }
  return initialState();
}
export interface LuckService {
  getRules(version?: string): Promise<Rules>;
  syncRules(input?: unknown): Promise<void>;
  getPrice(): Promise<{ price: string; source: string }>;
  getQuote(ticket: Ticket): Promise<Quote>;
  getRound(game: Game): Promise<AppState["daily"]>;
  getHistory(game: Game): Promise<HistoryRound[]>;
  getStats(): Promise<AppState["stats"]>;
  getVaults(): Promise<AppState["tiers"]>;
  getCamps(): Promise<AppState["camps"]>;
  getOrders(): Promise<Order[]>;
  getClaims(): Promise<Order[]>;
  getBalance(): Promise<AppState["wallet"]>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  authorization(): Promise<boolean>;
  approve(): Promise<void>;
  submit(ticket: Ticket, quote: Quote): Promise<Order>;
  submitBatch(entries: { ticket: Ticket; quote: Quote }[]): Promise<Order[]>;
  getResult(
    game: Game,
  ): Promise<{ result: number[]; stage: string; randomnessRequestId: null }>;
  claim(ids: string[]): Promise<void>;
  getRefundEligibility(): Promise<{ eligible: false; reason: string }>;
  getLedger(): Promise<AppState["ledger"]>;
}
class MockService implements LuckService {
  private state = readState();
  private listeners = new Set<() => void>();
  private quotes = new Map<string, Quote>();
  private used = new Set<string>();
  private submitting = false;
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private save(next: AppState) {
    localStorage.setItem(KEY, JSON.stringify(next));
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }
  private draft() {
    return structuredClone(this.state);
  }
  async getRules(version?: string) {
    if (version && version !== this.state.rules.version) {
      const r = [this.state.daily, this.state.quick].find(
        (r) => r.rules.version === version,
      );
      if (r) return r.rules;
      throw new Error("此演示缓存没有该版本规则");
    }
    return this.state.rules;
  }
  async syncRules(input?: unknown) {
    await pause();
    const s = this.draft();
    if (input) {
      const r = validateRules(input);
      if (
        JSON.stringify(r) !== JSON.stringify(s.rules) &&
        r.version === s.rules.version
      )
        throw new Error("修改配置时请使用新的规则版本");
      s.rules = r;
    }
    this.save(s);
  }
  async getPrice() {
    return { price: this.state.rules.price, source: "演示报价源" };
  }
  async getQuote(ticket: Ticket) {
    await pause();
    const round = this.state[ticket.game];
    this.assertOpen(ticket.game);
    const info = ticketInfo(ticket, round.rules);
    const u = rawDecimal(
      units(round.rules.unitU, 6) * BigInt(info.bets * ticket.multiplier),
    );
    const q: Quote = {
      quoteId: id("QUOTE"),
      game: ticket.game,
      roundId: round.id,
      ruleVersion: round.rules.version,
      uAmount: u,
      price: this.state.rules.price,
      tokenAmount: convertU(
        u,
        this.state.rules.price,
        config.token.decimals,
      ).toString(),
      quotedAt: Date.now(),
      expiresAt: Date.now() + config.quoteLifetime,
      priceSource: "演示报价源 · 非实时链上价格",
    };
    this.quotes.set(q.quoteId, q);
    return q;
  }
  async getRound(game: Game) {
    return this.state[game];
  }
  async getHistory(game: Game) {
    return this.state.history.filter((r) => r.game === game);
  }
  async getStats() {
    return this.state.stats;
  }
  async getVaults() {
    return this.state.tiers;
  }
  async getCamps() {
    return this.state.camps;
  }
  async getOrders() {
    return this.state.orders;
  }
  async getClaims() {
    return this.state.orders.filter((o) => o.status === "CLAIMABLE");
  }
  async getBalance() {
    return this.state.wallet;
  }
  async connect() {
    await pause();
    const s = this.draft();
    s.wallet.connected = true;
    this.save(s);
  }
  async disconnect() {
    const s = this.draft();
    s.wallet.connected = false;
    this.save(s);
  }
  async authorization() {
    return this.state.wallet.approved;
  }
  private assertWallet() {
    if (!this.state.wallet.connected) throw new Error("请先连接演示钱包");
    if (this.state.wallet.chainId !== config.network.chainId)
      throw new Error("网络不正确，请切换至 BNB Chain");
  }
  private assertOpen(game: Game) {
    const r = this.state[game];
    if (r.stage !== "OPEN" || Date.now() >= r.closesAt)
      throw new Error("本期已截止，请等待下一期");
  }
  async approve() {
    this.assertWallet();
    await pause();
    const s = this.draft();
    s.wallet.approved = true;
    this.save(s);
  }
  async submit(ticket: Ticket, quote: Quote) {
    if (this.submitting) throw new Error("正在提交，请勿重复操作");
    this.submitting = true;
    try {
      await pause(550);
      this.assertWallet();
      this.assertOpen(ticket.game);
      if (!this.state.wallet.approved) throw new Error("请先完成演示授权");
      const q = this.quotes.get(quote.quoteId),
        round = this.state[ticket.game],
        info = ticketInfo(ticket, round.rules);
      if (!q || q.expiresAt <= Date.now())
        throw new Error("报价已过期，请重新获取并确认");
      if (this.used.has(q.quoteId))
        throw new Error("此报价已经提交，请勿重复参与");
      const expectedU =
        units(round.rules.unitU, 6) * BigInt(info.bets * ticket.multiplier);
      if (
        q.game !== ticket.game ||
        q.roundId !== round.id ||
        q.ruleVersion !== round.rules.version ||
        units(q.uAmount, 6) !== expectedU
      )
        throw new Error("选号或期次已改变，请重新报价");
      if (BigInt(this.state.wallet.balance) < BigInt(q.tokenAmount))
        throw new Error("演示 luck 余额不足，请降低倍数");
      const order: Order = {
        ...ticket,
        id: id("ORDER"),
        roundId: round.id,
        ruleVersion: round.rules.version,
        quoteId: q.quoteId,
        price: q.price,
        uAmount: q.uAmount,
        paid: q.tokenAmount,
        weight: info.weight,
        betCount: info.bets,
        size: info.size,
        createdAt: Date.now(),
        status: "PENDING",
        rewardLuck: "0",
        rewardUsdt: "0",
        principal: "0",
        profit: "0",
        burn: "0",
      };
      const s = this.draft(),
        paid = BigInt(q.tokenAmount);
      s.wallet.balance = (BigInt(s.wallet.balance) - paid).toString();
      s.orders.unshift(order);
      s.stats.participants++;
      if (ticket.game === "daily") {
        const burn = (paid * BigInt(round.rules.dailyBurnBps)) / 10000n,
          deposit = paid - burn;
        let assigned = 0n;
        s.tiers.forEach((t, i) => {
          const share =
            i === s.tiers.length - 1
              ? deposit - assigned
              : (deposit *
                  BigInt(
                    round.rules.tiers.find((x) => x.size === t.size)!.shareBps,
                  )) /
                10000n;
          assigned += share;
          t.luck = (BigInt(t.luck) + share).toString();
        });
        s.stats.luckBurned = (BigInt(s.stats.luckBurned) + burn).toString();
        order.burn = burn.toString();
        s.ledger.unshift(
          {
            id: id("FLOW"),
            description: "每日参与 · 奖励金库入库",
            amount: deposit.toString(),
            unit: "luck",
            at: Date.now(),
          },
          {
            id: id("FLOW"),
            description: "每日参与 · 销毁",
            amount: burn.toString(),
            unit: "luck",
            at: Date.now(),
          },
        );
      } else {
        const camp = s.camps.find((p) => p.camp === ticket.camp)!;
        camp.funds = (BigInt(camp.funds) + paid).toString();
        camp.weight += ticket.multiplier;
        camp.people++;
      }
      this.save(s);
      this.used.add(q.quoteId);
      return order;
    } finally {
      this.submitting = false;
    }
  }
  async getResult(game: Game) {
    const r = this.state[game];
    return { result: r.result, stage: r.stage, randomnessRequestId: null };
  }
  async submitBatch(entries: { ticket: Ticket; quote: Quote }[]) {
    if (this.submitting) throw new Error("正在提交，请勿重复操作");
    this.submitting = true;
    try {
      await pause(550);
      this.assertWallet();
      this.assertOpen("quick");
      if (!this.state.wallet.approved) throw new Error("请先完成演示授权");
      if (!entries.length) throw new Error("请先在桌面放置筹码");
      const round = this.state.quick,
        seen = new Set<string>();
      const orders = entries.map(({ ticket, quote }) => {
        if (ticket.game !== "quick")
          throw new Error("批量参与仅适用于骰子牌桌");
        const info = ticketInfo(ticket, round.rules),
          q = this.quotes.get(quote.quoteId);
        if (!q || q.expiresAt <= Date.now())
          throw new Error("报价已过期，请重新获取并确认");
        if (this.used.has(q.quoteId) || seen.has(q.quoteId))
          throw new Error("此报价已经提交，请勿重复参与");
        seen.add(q.quoteId);
        if (
          q.game !== "quick" ||
          q.roundId !== round.id ||
          q.ruleVersion !== round.rules.version ||
          units(q.uAmount, 6) !==
            units(round.rules.unitU, 6) * BigInt(ticket.multiplier)
        )
          throw new Error("筹码或期次已改变，请重新报价");
        return {
          ...structuredClone(ticket),
          id: id("ORDER"),
          roundId: round.id,
          ruleVersion: round.rules.version,
          quoteId: q.quoteId,
          price: q.price,
          uAmount: q.uAmount,
          paid: q.tokenAmount,
          weight: info.weight,
          betCount: info.bets,
          size: info.size,
          createdAt: Date.now(),
          status: "PENDING",
          rewardLuck: "0",
          rewardUsdt: "0",
          principal: "0",
          profit: "0",
          burn: "0",
        } as Order;
      });
      const total = orders.reduce((sum, o) => sum + BigInt(o.paid), 0n);
      if (BigInt(this.state.wallet.balance) < total)
        throw new Error("演示 luck 余额不足，请减少待确认筹码");
      const s = this.draft();
      s.wallet.balance = (BigInt(s.wallet.balance) - total).toString();
      for (const order of orders) {
        s.orders.unshift(order);
        const pool = s.camps.find((c) => c.camp === order.camp)!;
        pool.funds = (BigInt(pool.funds) + BigInt(order.paid)).toString();
        pool.weight += order.multiplier;
        pool.people++;
      }
      s.stats.participants += orders.length;
      this.save(s);
      seen.forEach((quoteId) => this.used.add(quoteId));
      return orders;
    } finally {
      this.submitting = false;
    }
  }
  async claim(ids: string[]) {
    this.assertWallet();
    await pause(500);
    this.assertWallet();
    const s = this.draft();
    const eligible = s.orders.filter(
      (o) => ids.includes(o.id) && o.status === "CLAIMABLE",
    );
    if (!eligible.length) throw new Error("没有可领取项目，奖励可能已领取");
    for (const o of eligible) {
      s.wallet.balance = (
        BigInt(s.wallet.balance) + BigInt(o.rewardLuck)
      ).toString();
      s.wallet.usdt = (BigInt(s.wallet.usdt) + BigInt(o.rewardUsdt)).toString();
      o.status = "CLAIMED";
      s.ledger.unshift({
        id: id("CLAIM"),
        description: `${o.game === "daily" ? "每日奖励" : "快速结算"} · 演示领取`,
        amount: o.rewardLuck,
        unit: "luck",
        at: Date.now(),
      });
    }
    this.save(s);
  }
  async getRefundEligibility() {
    return {
      eligible: false as const,
      reason: "空胜阵营处理规则待确认，未实现退款",
    };
  }
  async getLedger() {
    return this.state.ledger;
  }
  refreshStage() {
    // Several preview tabs share one cache; use the latest round before advancing it.
    const cached = localStorage.getItem(KEY);
    if (cached && cached !== JSON.stringify(this.state)) {
      this.state = readState();
      this.listeners.forEach((fn) => fn());
    }
    const now = Date.now();
    const s = this.draft();
    let changed = false;
    for (const game of ["daily", "quick"] as Game[]) {
      // Bounded catch-up after a background tab resumes. Results remain service-owned.
      for (let i = 0; i < 6; i++) {
        const r = s[game];
        const resultAt = r.resultAt ?? r.drawsAt + 2000;
        const revealDuration = game === "daily" ? 21_000 : 3000;
        const due =
          (r.stage === "OPEN" && now >= r.closesAt) ||
          (r.stage === "CLOSED" && now >= r.drawsAt) ||
          (r.stage === "RANDOMNESS_PENDING" && now >= r.drawsAt + 2000) ||
          (r.stage === "DRAWN" && now >= resultAt + revealDuration) ||
          (r.stage === "SETTLING" && now >= resultAt + revealDuration + 2000) ||
          (r.stage === "SETTLED" && now >= resultAt + revealDuration + 12_000);
        if (!due) break;
        this.advanceState(s, game, false, now);
        changed = true;
      }
    }
    if (changed) this.save(s);
  }
  startDrawPreview(game: Game) {
    const s = this.draft();
    if (s[game].stage !== "OPEN") throw new Error("本期正在开奖，请等待下一期");
    const now = Date.now();
    s[game].closesAt = game === "quick" ? now : now + 2000;
    s[game].drawsAt =
      now + (game === "quick" ? config.quickShakeDuration : 2000);
    s[game].stage = game === "quick" ? "CLOSED" : "OPEN";
    this.save(s);
  }
  async advance(game: Game, matchMine = false) {
    await pause(250);
    const s = this.draft();
    this.advanceState(s, game, matchMine, Date.now());
    this.save(s);
  }
  private advanceState(
    s: AppState,
    game: Game,
    matchMine: boolean,
    now: number,
  ) {
    const r = s[game];
    if (r.stage === "SETTLED") {
      const nextAt = Math.max(now, r.drawsAt + 1),
        rules = Date.parse(s.rules.effectiveAt) <= nextAt ? s.rules : r.rules;
      s[game] = createRound(game, rules, nextAt);
      // Previewing a draw early must not re-use the just-settled round identity.
      while (s.history.some((h) => h.game === game && h.id === s[game].id))
        s[game].id += "-N";
      if (game === "quick") s.camps = seedCamps();
      else s.tiers.forEach((t) => (t.weight = 0));
      return;
    }
    if (r.stage === "NEEDS_REVIEW")
      throw new Error("空胜阵营规则尚未确认，本期保持待处理");
    const next = {
      OPEN: "CLOSED",
      CLOSED: "RANDOMNESS_PENDING",
      RANDOMNESS_PENDING: "DRAWN",
      DRAWN: "SETTLING",
      SETTLING: "SETTLED",
    } as const;
    r.stage = next[r.stage];
    if (r.stage === "DRAWN") {
      r.resultAt = now;
      const mine = s.orders.find((o) => o.game === game && o.roundId === r.id);
      if (game === "daily") {
        const nums = matchMine && mine ? mine.numbers.slice(0, 6) : [];
        while (nums.length < 6) {
          const n = Math.floor(Math.random() * 20);
          if (!nums.includes(n)) nums.push(n);
        }
        r.result = nums.sort((a, b) => a - b);
      } else
        r.result =
          matchMine && mine
            ? mine.camp === "small"
              ? [1, 2, 3]
              : mine.camp === "big"
                ? [4, 5, 6]
                : [3, 3, 3]
            : Array.from(
                { length: 3 },
                () => Math.floor(Math.random() * 6) + 1,
              );
    }
    if (r.stage === "SETTLED") this.settle(s, game);
  }
  private settle(s: AppState, game: Game) {
    const r = s[game],
      orders = s.orders.filter((o) => o.game === game && o.roundId === r.id),
      record: HistoryRound = {
        id: r.id,
        game,
        at: Date.now(),
        result: r.result,
        stage: "SETTLED",
        ruleVersion: r.rules.version,
        releaseLuck: "0",
        releaseUsdt: "0",
        rolledLuck: "0",
        burn: "0",
        demoId: id("DRAW"),
      };
    if (game === "daily") {
      const settlements: TierSettlement[] = [];
      for (const tier of s.tiers) {
        const candidates = orders.filter((o) => o.size === tier.size),
          weights = candidates.map((o) =>
            winningWeight(o.numbers, r.result, o.size, o.multiplier),
          );
        const luck = dailyRelease(
            BigInt(tier.luck),
            weights,
            r.rules.releaseBps,
          ),
          usdt = dailyRelease(BigInt(tier.usdt), weights, r.rules.releaseBps);
        candidates.forEach((o, i) => {
          o.status = weights[i] ? "CLAIMABLE" : "LOST";
          o.rewardLuck = luck.paid[i].toString();
          o.rewardUsdt = usdt.paid[i].toString();
        });
        tier.luck = luck.rollover.toString();
        tier.usdt = usdt.rollover.toString();
        tier.weight = weights.reduce((a, b) => a + b, 0);
        settlements.push({
          size: tier.size,
          releasedUsdt: usdt.released.toString(),
          releasedLuck: luck.released.toString(),
          rolledUsdt: usdt.rollover.toString(),
          rolledLuck: luck.rollover.toString(),
          weight: tier.weight,
        });
        record.releaseLuck = (
          BigInt(record.releaseLuck) + luck.released
        ).toString();
        record.releaseUsdt = (
          BigInt(record.releaseUsdt) + usdt.released
        ).toString();
        record.rolledLuck = (
          BigInt(record.rolledLuck) + luck.rollover
        ).toString();
      }
      record.tiers = settlements;
      record.burn = orders.reduce((a, o) => a + BigInt(o.burn), 0n).toString();
    } else {
      const winningCamp = classifyDice(r.result),
        camp = s.camps.find((c) => c.camp === winningCamp)!,
        winners = orders.filter((o) => o.camp === winningCamp),
        seedPrincipal =
          BigInt(camp.funds) - winners.reduce((a, o) => a + BigInt(o.paid), 0n),
        seedWeight = camp.weight - winners.reduce((a, o) => a + o.weight, 0);
      const settlement = settleQuick(
        s.camps,
        winningCamp,
        [
          ...winners.map((o) => ({
            principal: BigInt(o.paid),
            weight: o.weight,
          })),
          ...(seedWeight > 0
            ? [{ principal: seedPrincipal, weight: seedWeight }]
            : []),
        ],
        r.rules.quickBurnBps,
      );
      record.camps = structuredClone(s.camps);
      record.stage = settlement.status;
      r.stage = settlement.status;
      if (settlement.status === "NEEDS_REVIEW")
        orders.forEach((o) => (o.status = "NEEDS_REVIEW"));
      else {
        orders.forEach((o) => (o.status = "LOST"));
        winners.forEach((o, i) => {
          const p = settlement.payouts[i];
          o.status = "CLAIMABLE";
          o.principal = p.principal.toString();
          o.profit = p.profit.toString();
          o.burn = p.burn.toString();
          o.rewardLuck = p.payout.toString();
        });
        record.releaseLuck = settlement.payouts
          .reduce((a, p) => a + p.payout, 0n)
          .toString();
        record.burn = settlement.burned.toString();
        record.rolledLuck = settlement.retained.toString();
        s.stats.luckBurned = (
          BigInt(s.stats.luckBurned) + settlement.burned
        ).toString();
      }
    }
    s.stats.usdtPaid = (
      BigInt(s.stats.usdtPaid) + BigInt(record.releaseUsdt)
    ).toString();
    s.stats.luckPaid = (
      BigInt(s.stats.luckPaid) + BigInt(record.releaseLuck)
    ).toString();
    s.history.unshift(record);
  }
}
export const mock = new MockService();
// Real adapter deliberately fails closed until a concrete API/contract integration is supplied.
export const realAdapter: LuckService = new Proxy({} as LuckService, {
  get: (_target, name) => async () => {
    throw new Error(
      `真实服务尚未接入（${String(name)}）。请配置 API、合约地址并实现 src/services/real.ts 适配器。`,
    );
  },
});
export const service: LuckService = config.mode === "real" ? realAdapter : mock;
