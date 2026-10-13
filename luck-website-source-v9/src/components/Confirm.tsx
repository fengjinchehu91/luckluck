import { useEffect, useState } from "react";
import { ArrowRight, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { campLabels } from "../config";
import { useApp, useNow } from "../hooks";
import { quickEstimate } from "../lib/math";
import { service } from "../services";
import type { Quote, Ticket } from "../types";
import { Badge, Modal, Money, Spinner, useToast } from "./ui";
export function Confirm({
  ticket,
  onClose,
}: {
  ticket: Ticket;
  onClose: () => void;
}) {
  const state = useApp(),
    now = useNow(),
    toast = useToast();
  const [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [success, setSuccess] = useState(false);
  async function fetchQuote() {
    setLoading(true);
    setQuote(null);
    setError("");
    try {
      setQuote(await service.getQuote(ticket));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void fetchQuote();
  }, []);
  const expired = !!quote && quote.expiresAt <= now,
    insufficient =
      !!quote && BigInt(state.wallet.balance) < BigInt(quote.tokenAmount);
  const camp = state.camps.find((c) => c.camp === ticket.camp),
    estimate =
      quote && camp
        ? quickEstimate(
            BigInt(quote.tokenAmount),
            ticket.multiplier,
            camp.weight + ticket.multiplier,
            state.camps
              .filter((c) => c.camp !== ticket.camp)
              .reduce((a, c) => a + BigInt(c.funds), 0n),
            state.quick.rules.quickBurnBps,
          )
        : null;
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!state.wallet.connected) {
        await service.connect();
        return;
      }
      if (!quote) return;
      if (!state.wallet.approved) await service.approve();
      await service.submit(ticket, quote);
      setSuccess(true);
      toast("演示参与成功，订单已保存至个人中心");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={success ? "幸运已就位" : "确认演示参与"} onClose={onClose}>
      {success ? (
        <div className="success-state">
          <span>
            <ShieldCheck size={44} />
          </span>
          <h3>参与成功，等待开奖</h3>
          <p>本次参与的价格、luck 支付额与权重已锁定。</p>
          <p className="muted">
            可以在底部「开发设置」推进演示开奖，随后到个人中心领取。
          </p>
          <button className="button primary full" onClick={onClose}>
            完成 <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="confirm-game">
            <strong>{ticket.game === "daily" ? "每日挑战" : "快速挑战"}</strong>
            <Badge tone="gold">
              {ticket.game === "daily"
                ? ticket.mode === "normal"
                  ? "普通选号"
                  : ticket.mode
                : `${campLabels[ticket.camp!]} 阵营`}
            </Badge>
          </div>
          {ticket.game === "daily" && (
            <div className="selected-chips">
              {ticket.numbers.map((n) => (
                <span key={n}>{String(n).padStart(2, "0")}</span>
              ))}
            </div>
          )}
          <div className="confirm-rows">
            <div className="key-row">
              <span>参与期号</span>
              <strong>#{state[ticket.game].id}</strong>
            </div>
            <div className="key-row">
              <span>参与倍数</span>
              <strong>{ticket.multiplier}×</strong>
            </div>
            {loading ? (
              <div className="loading-row">
                <Spinner />
                正在获取演示报价…
              </div>
            ) : (
              quote && (
                <>
                  <div className="key-row">
                    <span>U 计价总额</span>
                    <strong>{Number(quote.uAmount)} U</strong>
                  </div>
                  <div className="key-row">
                    <span>锁定价格</span>
                    <strong>{quote.price} U / luck</strong>
                  </div>
                  <div className="confirm-payment">
                    <span>预计支付</span>
                    <Money value={quote.tokenAmount} digits={6} />
                  </div>
                  <div className={`quote-expiry ${expired ? "expired" : ""}`}>
                    <Clock3 size={14} />
                    {expired
                      ? "报价已过期，请重新获取并确认"
                      : `报价有效期剩余 ${Math.ceil((quote.expiresAt - now) / 1000)} 秒`}
                    <button
                      aria-label="重新报价"
                      disabled={busy || loading}
                      onClick={fetchQuote}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  {estimate && (
                    <div className="estimate-box">
                      <h4>若此阵营胜出 · 当前参考</h4>
                      <div className="key-row">
                        <span>返还本金</span>
                        <Money value={estimate.principal} />
                      </div>
                      <div className="key-row">
                        <span>税前净盈利</span>
                        <Money value={estimate.profit} />
                      </div>
                      <div className="key-row">
                        <span>净盈利销毁</span>
                        <Money value={estimate.burn} />
                      </div>
                      <div className="key-row">
                        <span>预计到账</span>
                        <Money value={estimate.payout} />
                      </div>
                      <small>
                        按你本次本金与有效权重估算，最终以结算为准。
                      </small>
                    </div>
                  )}
                </>
              )
            )}
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          {insufficient && (
            <p className="error-text">演示余额不足，请减少参与倍数。</p>
          )}
          <button
            className="button primary full"
            disabled={
              busy ||
              loading ||
              expired ||
              !quote ||
              (state.wallet.connected && insufficient) ||
              state[ticket.game].stage !== "OPEN"
            }
            onClick={submit}
          >
            {busy ? <Spinner /> : <ShieldCheck size={17} />}{" "}
            {!state.wallet.connected
              ? "连接演示钱包"
              : state.wallet.approved
                ? "确认演示参与"
                : "演示授权并参与"}
          </button>
          {(expired || (!quote && !loading)) && (
            <button className="button secondary full" onClick={fetchQuote}>
              重新获取报价
            </button>
          )}
          <p className="info-note">
            仅模拟操作，不发起真实转账。{quote?.priceSource}。
          </p>
        </>
      )}
    </Modal>
  );
}
