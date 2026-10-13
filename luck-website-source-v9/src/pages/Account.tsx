import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Gift, Wallet } from "lucide-react";
import { campLabels } from "../config";
import { useApp } from "../hooks";
import { service } from "../services";
import {
  Badge,
  ClaimStatus,
  CopyButton,
  Empty,
  Money,
  PageHead,
  Spinner,
  useToast,
} from "../components/ui";
export default function Account() {
  const { orders, wallet } = useApp(),
    toast = useToast();
  const [game, setGame] = useState("daily"),
    [busy, setBusy] = useState(false);
  const claimable = orders.filter((o) => o.status === "CLAIMABLE"),
    daily = claimable.filter((o) => o.game === "daily"),
    quick = orders.filter(
      (o) =>
        o.game === "quick" &&
        ["CLAIMABLE", "CLAIMED", "LOST"].includes(o.status),
    );
  async function claim(ids: string[]) {
    setBusy(true);
    try {
      await service.claim(ids);
      toast("演示领取成功，奖励已计入演示余额");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="inner-page">
      <PageHead
        title="我的幸运账户"
        description="每一笔参与、每一份奖励，都在这里。"
      >
        <Badge>演示个人中心</Badge>
      </PageHead>
      {!wallet.connected ? (
        <section className="panel account-connect">
          <Wallet size={42} />
          <h2>连接后，查看你的幸运记录</h2>
          <p>使用演示钱包即可完整体验，无需真实资产。</p>
          <button
            className="button primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await service.connect();
              } catch (e) {
                toast((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Spinner /> : <Wallet size={17} />}连接演示钱包
          </button>
        </section>
      ) : (
        <>
          <section className="panel account-wallet">
            <div className="wallet-avatar">
              <Wallet size={25} />
            </div>
            <div>
              <h2>
                我的演示钱包 <Badge>BNB Chain</Badge>
              </h2>
              <p>
                {wallet.address}
                <CopyButton value={wallet.address} />
              </p>
            </div>
            <div className="account-balance">
              <span>luck 可用余额</span>
              <Money value={wallet.balance} />
            </div>
            <div className="account-balance">
              <span>已领取 USDT</span>
              <Money value={wallet.usdt} unit="USDT" />
            </div>
          </section>
          <section className="account-rewards">
            <div className="panel">
              <h3>
                <Gift size={18} />
                每日待领奖 · USDT
              </h3>
              <Money
                value={daily.reduce((a, o) => a + BigInt(o.rewardUsdt), 0n)}
                unit="USDT"
              />
              <span>{daily.length} 笔待领取</span>
            </div>
            <div className="panel">
              <h3>
                <Gift size={18} />
                每日待领奖 · luck
              </h3>
              <Money
                value={daily.reduce((a, o) => a + BigInt(o.rewardLuck), 0n)}
              />
              <span>两份奖励同时领取</span>
            </div>
            <div className="panel claim-card">
              <div>
                <h3>你的幸运，准备就绪</h3>
                <p>共 {claimable.length} 项可领取奖励</p>
              </div>
              <button
                className="button primary"
                disabled={busy || !claimable.length}
                onClick={() => claim(claimable.map((o) => o.id))}
              >
                {busy ? <Spinner /> : <Gift size={16} />}演示全部领取
              </button>
              <small>仅领取符合状态的项目，已领取不可重复。</small>
            </div>
          </section>
          <div className="account-quick-stats">
            <div>
              <span>快速 · 参与本金</span>
              <Money value={quick.reduce((a, o) => a + BigInt(o.paid), 0n)} />
            </div>
            <div>
              <span>快速 · 税前净盈利</span>
              <Money value={quick.reduce((a, o) => a + BigInt(o.profit), 0n)} />
            </div>
            <div>
              <span>快速 · 净盈利销毁</span>
              <Money value={quick.reduce((a, o) => a + BigInt(o.burn), 0n)} />
            </div>
            <div>
              <span>快速 · 已结算盈亏</span>
              <Money
                value={quick.reduce(
                  (a, o) => a + BigInt(o.rewardLuck) - BigInt(o.paid),
                  0n,
                )}
              />
            </div>
          </div>
          <section className="panel records-panel">
            <div className="panel-heading">
              <div className="tabs">
                <button
                  className={game === "daily" ? "active" : ""}
                  onClick={() => setGame("daily")}
                >
                  每日参与
                </button>
                <button
                  className={game === "quick" ? "active" : ""}
                  onClick={() => setGame("quick")}
                >
                  快速参与
                </button>
              </div>
              <Link to={game === "daily" ? "/daily" : "/quick"}>
                去参与 <ArrowUpRight size={15} />
              </Link>
            </div>
            {orders.filter((o) => o.game === game).length ? (
              <div className="table-scroll">
                <table className="account-table">
                  <thead>
                    <tr>
                      <th>参与期号 / 演示订单</th>
                      <th>选择 / 倍数</th>
                      <th>锁定支付</th>
                      <th>
                        {game === "daily"
                          ? "双份奖励"
                          : "本金 / 净盈利 / 销毁 / 到账"}
                      </th>
                      <th>领取状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => o.game === game)
                      .map((o) => (
                        <tr key={o.id}>
                          <td>
                            <strong>#{o.roundId}</strong>
                            <small>{o.id}</small>
                            <small>规则 {o.ruleVersion}</small>
                            <small>{o.quoteId}</small>
                          </td>
                          <td>
                            {game === "daily" ? (
                              <>
                                <strong>
                                  {o.numbers
                                    .map((n) => String(n).padStart(2, "0"))
                                    .join(" · ")}
                                </strong>
                                <small>
                                  {o.mode === "normal" ? "普通" : o.mode} ·{" "}
                                  {o.betCount} 注 × {o.multiplier}
                                </small>
                              </>
                            ) : (
                              <>
                                <Badge tone="gold">{campLabels[o.camp!]}</Badge>
                                <small>
                                  {o.multiplier} 倍 · 权重 {o.weight}
                                </small>
                              </>
                            )}
                          </td>
                          <td>
                            <Money value={o.paid} />
                            <small>
                              {Number(o.uAmount)} U · 单价 {o.price}
                            </small>
                          </td>
                          <td>
                            {game === "daily" ? (
                              <>
                                <Money value={o.rewardUsdt} unit="USDT" />
                                <Money value={o.rewardLuck} />
                              </>
                            ) : (
                              <div className="order-breakdown">
                                <span>
                                  返还 <Money value={o.principal} />
                                </span>
                                <span>
                                  盈利 <Money value={o.profit} />
                                </span>
                                <span>
                                  销毁 <Money value={o.burn} />
                                </span>
                                <span>
                                  到账 <Money value={o.rewardLuck} />
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            {o.status === "CLAIMABLE" ? (
                              <button
                                className="button secondary small-button"
                                disabled={busy}
                                onClick={() => claim([o.id])}
                              >
                                演示领取
                              </button>
                            ) : (
                              <ClaimStatus status={o.status} />
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </section>
          <p className="info-note">
            奖励状态由演示服务记录；前端防重复保护不能替代合约保护。可通过「开发设置」推进期次并体验领奖。
          </p>
        </>
      )}
    </div>
  );
}
