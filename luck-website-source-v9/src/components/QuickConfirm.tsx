import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { campLabels } from "../config";
import { useApp, useNow } from "../hooks";
import { rawDecimal, units } from "../lib/math";
import { service } from "../services";
import type { Quote, Ticket } from "../types";
import { Modal, Money, Spinner, useToast } from "./ui";

export function QuickConfirm({
  tickets,
  roundId,
  onClose,
  onSuccess,
}: {
  tickets: Ticket[];
  roundId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const state = useApp(),
    now = useNow(),
    toast = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false);
  const busyRef = useRef(false);
  const close = useCallback(() => {
    if (!busyRef.current) onClose();
  }, [onClose]);
  async function fetchQuotes() {
    setLoading(true);
    setQuotes([]);
    setError("");
    try {
      const next = await Promise.all(
        tickets.map((ticket) => service.getQuote(ticket)),
      );
      if (next.some((q) => q.roundId !== roundId))
        throw new Error("本期期次已结束，请返回牌桌");
      setQuotes(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void fetchQuotes();
  }, []);
  const totalPaid = quotes.reduce((sum, q) => sum + BigInt(q.tokenAmount), 0n);
  const totalU = rawDecimal(
    quotes.reduce((sum, q) => sum + units(q.uAmount, 6), 0n),
  );
  const expiresAt = Math.min(...quotes.map((q) => q.expiresAt));
  const expired = quotes.length > 0 && now >= expiresAt;
  const insufficient =
    state.wallet.connected && totalPaid > BigInt(state.wallet.balance);
  const open = state.quick.id === roundId && state.quick.stage === "OPEN";
  async function submit() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (!state.wallet.connected) {
        await service.connect();
        return;
      }
      if (!state.wallet.approved) await service.approve();
      await service.submitBatch(
        tickets.map((ticket, i) => ({ ticket, quote: quotes[i] })),
      );
      onSuccess();
      setSuccess(true);
      toast("本次筹码已统一确认，可以继续追加");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title={success ? "筹码已就位" : "统一确认筹码"} onClose={close}>
      {success ? (
        <div className="success-state">
          <span>
            <ShieldCheck size={44} />
          </span>
          <h3>本次参与成功</h3>
          <p>已下注筹码保留在桌上，封盘前可以继续追加。</p>
          <button className="button primary full" onClick={close}>
            返回牌桌 <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="confirm-rows">
            <div className="key-row">
              <span>参与期号</span>
              <strong>#{roundId}</strong>
            </div>
            {tickets.map((ticket) => (
              <div className="key-row" key={ticket.camp}>
                <span>{campLabels[ticket.camp!]}阵营</span>
                <strong>{ticket.multiplier.toLocaleString()} 倍</strong>
              </div>
            ))}
            {loading ? (
              <div className="loading-row">
                <Spinner />
                正在获取本次演示报价…
              </div>
            ) : (
              quotes.length > 0 && (
                <>
                  <div className="key-row">
                    <span>U 计价总额</span>
                    <strong>{Number(totalU).toLocaleString()} U</strong>
                  </div>
                  <div className="key-row">
                    <span>锁定价格</span>
                    <strong>{quotes[0].price} U / luck</strong>
                  </div>
                  <div className="confirm-payment">
                    <span>本次预计支付</span>
                    <Money value={totalPaid} digits={6} />
                  </div>
                  <div className={`quote-expiry ${expired ? "expired" : ""}`}>
                    {expired
                      ? "报价已过期，请重新获取"
                      : `报价有效期剩余 ${Math.ceil((expiresAt - now) / 1000)} 秒`}
                    <button
                      aria-label="重新报价"
                      disabled={busy || loading || !open}
                      onClick={fetchQuotes}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </>
              )
            )}
          </div>
          {!open && (
            <p className="error-text" role="alert">
              本期参与已截止，未确认筹码不会下注。
            </p>
          )}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          {insufficient && (
            <p className="error-text">
              演示余额不足，请返回牌桌减少待确认筹码。
            </p>
          )}
          <button
            className="button primary full"
            disabled={
              busy ||
              loading ||
              expired ||
              !quotes.length ||
              insufficient ||
              !open
            }
            onClick={submit}
          >
            {busy ? <Spinner /> : <ShieldCheck size={17} />}
            {!state.wallet.connected ? "连接演示钱包" : "统一确认演示参与"}
          </button>
          {!loading && (expired || !quotes.length) && open && (
            <button className="button secondary full" onClick={fetchQuotes}>
              重新获取报价
            </button>
          )}
          <p className="info-note">
            仅确认这次新放置的筹码。演示报价源，不发起真实转账。
          </p>
        </>
      )}
    </Modal>
  );
}
