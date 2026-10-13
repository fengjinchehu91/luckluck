import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Quote, Ticket } from "../types";
let mock: (typeof import("./index"))["mock"];
const ticket: Ticket = {
  game: "daily",
  mode: "normal",
  numbers: [1, 2],
  multiplier: 1,
};
async function finish<T>(p: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(1000);
  return p;
}
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-11T10:00:00.000Z"));
  vi.resetModules();
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
  });
  ({ mock } = await import("./index"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("mock transaction boundaries", () => {
  it("updates an existing open preview to the 10-second shake window", () => {
    const cached = structuredClone(mock.getSnapshot());
    cached.quick.closesAt = cached.quick.drawsAt - 20_000;
    localStorage.setItem("luck-preview-v1", JSON.stringify(cached));
    mock.refreshStage();
    const round = mock.getSnapshot().quick;
    expect(round.drawsAt - round.closesAt).toBe(10_000);
    expect(round.id).toBe(cached.quick.id);
    expect(round.stage).toBe("OPEN");
  });
  it("uses the shared cached round before advancing from another preview tab", () => {
    const cached = structuredClone(mock.getSnapshot());
    cached.quick.stage = "CLOSED";
    cached.quick.closesAt = Date.now();
    cached.quick.drawsAt = Date.now() + 10_000;
    localStorage.setItem("luck-preview-v1", JSON.stringify(cached));
    mock.refreshStage();
    expect(mock.getSnapshot().quick.stage).toBe("CLOSED");
    expect(mock.getSnapshot().quick.drawsAt).toBe(cached.quick.drawsAt);
  });
  it("seals the dice table for 10 seconds, waits for data, then settles only once", async () => {
    mock.startDrawPreview("quick");
    const roundId = mock.getSnapshot().quick.id;
    expect(mock.getSnapshot().quick.stage).toBe("CLOSED");
    expect(mock.getSnapshot().quick.result).toEqual([]);
    expect(
      mock.getSnapshot().quick.drawsAt - mock.getSnapshot().quick.closesAt,
    ).toBe(10_000);
    const rejected = expect(
      mock.getQuote({
        game: "quick",
        mode: "camp",
        numbers: [],
        camp: "big",
        multiplier: 1,
      }),
    ).rejects.toThrow("已截止");
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;
    await vi.advanceTimersByTimeAsync(8_999);
    mock.refreshStage();
    expect(mock.getSnapshot().quick.stage).toBe("CLOSED");
    await vi.advanceTimersByTimeAsync(1);
    mock.refreshStage();
    expect(mock.getSnapshot().quick.stage).toBe("RANDOMNESS_PENDING");
    expect(mock.getSnapshot().quick.result).toEqual([]);
    await vi.advanceTimersByTimeAsync(2000);
    mock.refreshStage();
    expect(mock.getSnapshot().quick.result).toHaveLength(3);
    expect(mock.getSnapshot().quick.stage).toBe("DRAWN");
    await vi.advanceTimersByTimeAsync(5000);
    mock.refreshStage();
    mock.refreshStage();
    expect(mock.getSnapshot().quick.stage).toBe("SETTLED");
    expect(
      mock.getSnapshot().history.filter((h) => h.id === roundId),
    ).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(10_000);
    mock.refreshStage();
    expect(mock.getSnapshot().quick.id).not.toBe(roundId);
    expect(mock.getSnapshot().quick.result).toEqual([]);
  });
  it("automatically draws six unique 0–19 numbers and preserves a zero-number winning ticket", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const zeroTicket = { ...ticket, numbers: [0, 19] };
    const quote = await finish(mock.getQuote(zeroTicket));
    await finish(mock.submit(zeroTicket, quote));
    for (let i = 0; i < 3; i++) await finish(mock.advance("daily", true));
    const result = mock.getSnapshot().daily.result;
    expect(result).toContain(0);
    expect(result).toContain(19);
    expect(new Set(result).size).toBe(6);
    expect(result.every((n) => n >= 0 && n <= 19)).toBe(true);
    await vi.advanceTimersByTimeAsync(23_000);
    mock.refreshStage();
    expect(mock.getSnapshot().orders[0].status).toBe("CLAIMABLE");
  });
  it("locks order amounts and prevents reuse of a submitted quote", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const quote = await finish(mock.getQuote(ticket));
    const order = await finish(mock.submit(ticket, quote));
    const balance = mock.getSnapshot().wallet.balance;
    const repeat = expect(mock.submit(ticket, quote)).rejects.toThrow(
      "已经提交",
    );
    await vi.advanceTimersByTimeAsync(1000);
    await repeat;
    expect(mock.getSnapshot().wallet.balance).toBe(balance);
    expect(order.paid).toBe(quote.tokenAmount);
    expect(mock.getSnapshot().orders).toHaveLength(1);
  });
  it("requires an explicit new quote after expiry", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const quote: Quote = await finish(mock.getQuote(ticket));
    await vi.advanceTimersByTimeAsync(61_000);
    const submit = expect(mock.submit(ticket, quote)).rejects.toThrow(
      "报价已过期",
    );
    await vi.advanceTimersByTimeAsync(1000);
    await submit;
    expect(mock.getSnapshot().orders).toHaveLength(0);
  });
  it("keeps current rules snapshotted and refuses invalid imports", async () => {
    const before = mock.getSnapshot().daily.rules;
    await finish(
      mock.syncRules({
        ...before,
        version: "1.0.1",
        price: "0.01",
        unitU: "2",
      }),
    );
    expect(mock.getSnapshot().daily.rules.unitU).toBe("1");
    expect(mock.getSnapshot().rules.unitU).toBe("2");
    const invalid = expect(
      mock.syncRules({ ...before, version: "1.0.2", releaseBps: -5 }),
    ).rejects.toThrow("比例");
    await vi.advanceTimersByTimeAsync(1000);
    await invalid;
  });
  it("settles and claims each reward only once", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const quote = await finish(mock.getQuote(ticket));
    const order = await finish(mock.submit(ticket, quote));
    for (let i = 0; i < 5; i++) await finish(mock.advance("daily", true));
    expect(mock.getSnapshot().orders[0].status).toBe("CLAIMABLE");
    await finish(mock.claim([order.id]));
    const balance = mock.getSnapshot().wallet.balance;
    const repeat = expect(mock.claim([order.id])).rejects.toThrow("没有可领取");
    await vi.advanceTimersByTimeAsync(1000);
    await repeat;
    expect(mock.getSnapshot().wallet.balance).toBe(balance);
  });
  it("real adapter never falls back to demo data or fake success", async () => {
    const { realAdapter } = await import("./index");
    await expect(realAdapter.getStats()).rejects.toThrow("真实服务尚未接入");
    await expect(realAdapter.connect()).rejects.toThrow("真实服务尚未接入");
  });
  it("confirms multiple camps together and retains prior orders and chip quantities on an additional batch", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const small: Ticket = {
      game: "quick",
      mode: "camp",
      numbers: [],
      camp: "small",
      multiplier: 8,
      chips: [{ value: 1, count: 8 }],
    };
    const big: Ticket = {
      ...small,
      camp: "big",
      multiplier: 5,
      chips: [{ value: 5, count: 1 }],
    };
    const quotes = await finish(
      Promise.all([small, big].map((t) => mock.getQuote(t))),
    );
    const before = structuredClone(mock.getSnapshot());
    const orders = await finish(
      mock.submitBatch(
        [small, big].map((ticket, i) => ({ ticket, quote: quotes[i] })),
      ),
    );
    expect(mock.getSnapshot().orders).toHaveLength(2);
    expect(
      BigInt(before.wallet.balance) - BigInt(mock.getSnapshot().wallet.balance),
    ).toBe(quotes.reduce((sum, q) => sum + BigInt(q.tokenAmount), 0n));
    expect(orders[0].chips).toEqual([{ value: 1, count: 8 }]);
    const nextQuote = await finish(mock.getQuote(small));
    await finish(mock.submitBatch([{ ticket: small, quote: nextQuote }]));
    expect(mock.getSnapshot().orders).toHaveLength(3);
    expect(
      orders.every((o) =>
        mock.getSnapshot().orders.some((saved) => saved.id === o.id),
      ),
    ).toBe(true);
    expect(
      mock.getSnapshot().camps.find((c) => c.camp === "small")!.weight,
    ).toBe(before.camps.find((c) => c.camp === "small")!.weight + 16);
    const duplicate = expect(
      mock.submitBatch([{ ticket: small, quote: nextQuote }]),
    ).rejects.toThrow("已经提交");
    await vi.advanceTimersByTimeAsync(1000);
    await duplicate;
    expect(mock.getSnapshot().orders).toHaveLength(3);
  });
  it("does not save or charge the first camp when another item in a batch has an invalid quote", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const small: Ticket = {
      game: "quick",
      mode: "camp",
      numbers: [],
      camp: "small",
      multiplier: 1,
    };
    const big: Ticket = { ...small, camp: "big" };
    const [a, b] = await finish(
      Promise.all([mock.getQuote(small), mock.getQuote(big)]),
    );
    const before = structuredClone(mock.getSnapshot());
    const rejection = expect(
      mock.submitBatch([
        { ticket: small, quote: a },
        { ticket: { ...big, multiplier: 2 }, quote: b },
      ]),
    ).rejects.toThrow("筹码或期次");
    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    expect(mock.getSnapshot()).toEqual(before);
    await finish(mock.submitBatch([{ ticket: small, quote: a }]));
    expect(mock.getSnapshot().orders).toHaveLength(1);
  });
  it("validates combined funds and chip metadata before making any change", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const ticket: Ticket = {
      game: "quick",
      mode: "camp",
      numbers: [],
      camp: "small",
      multiplier: 170,
    };
    const tickets = [ticket, { ...ticket, camp: "big" as const }];
    const quotes = await finish(
      Promise.all(tickets.map((t) => mock.getQuote(t))),
    );
    const before = structuredClone(mock.getSnapshot());
    const rejection = expect(
      mock.submitBatch(
        tickets.map((ticket, i) => ({ ticket, quote: quotes[i] })),
      ),
    ).rejects.toThrow("余额不足");
    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    expect(mock.getSnapshot()).toEqual(before);
    const bad = expect(
      mock.getQuote({
        ...ticket,
        multiplier: 8,
        chips: [{ value: 1, count: 1 }],
      }),
    ).rejects.toThrow("筹码数量");
    await vi.advanceTimersByTimeAsync(1000);
    await bad;
  });
  it("refuses the whole batch after the table seals", async () => {
    await finish(mock.connect());
    await finish(mock.approve());
    const ticket: Ticket = {
      game: "quick",
      mode: "camp",
      numbers: [],
      camp: "triple",
      multiplier: 8,
    };
    const quote = await finish(mock.getQuote(ticket));
    mock.startDrawPreview("quick");
    const before = structuredClone(mock.getSnapshot());
    const rejection = expect(
      mock.submitBatch([{ ticket, quote }]),
    ).rejects.toThrow("已截止");
    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    expect(mock.getSnapshot()).toEqual(before);
  });
});
