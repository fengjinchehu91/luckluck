import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Flame,
  Undo2,
  Users,
} from "lucide-react";
import { campLabels, config } from "../config";
import { useApp } from "../hooks";
import {
  classifyDice,
  convertU,
  quickEstimate,
  rawDecimal,
  units,
} from "../lib/math";
import type { Camp, Ticket } from "../types";
import { Badge, ClaimStatus, Dice, Money, useToast } from "../components/ui";
import { QuickConfirm } from "../components/QuickConfirm";
import { TableChips, type TableChipGroup } from "../components/TableChips";
import { DrawTimer, PreviewDraw, RecentDraws } from "../components/DrawStage";
import { CasinoLight } from "../components/CasinoLight";
import { DealerFilm } from "../components/DealerFilm";
import "./QuickTable.css";

const chipValues = [1, 5, 10, 50];
type Placement = { id: string; camp: Camp; value: number; count: number };

export default function Quick() {
  const state = useApp(),
    round = state.quick,
    rules = round.rules;
  const last = state.history.find((h) => h.game === "quick")!;
  const [camp, setCamp] = useState<Camp>("triple"),
    [multiplier, setMultiplier] = useState(1),
    [chipValue, setChipValue] = useState(1),
    [draft, setDraft] = useState<{ roundId: string; placements: Placement[] }>({
      roundId: round.id,
      placements: [],
    }),
    [confirm, setConfirm] = useState<{
      roundId: string;
      placements: Placement[];
      tickets: Ticket[];
    } | null>(null),
    [recordTab, setRecordTab] = useState("all");
  const open = round.stage === "OPEN",
    revealed = round.result.length === 3;
  const shaking = round.stage === "CLOSED";
  const toast = useToast();
  const valid =
    Number.isSafeInteger(multiplier) &&
    multiplier > 0 &&
    multiplier <= 1_000_000;
  const placements = draft.roundId === round.id ? draft.placements : [];
  const tickets: Ticket[] = state.camps.flatMap((c) => {
    const chips = placements
      .filter((p) => p.camp === c.camp)
      .map(({ value, count }) => ({ value, count }));
    const multiplier = chips.reduce((sum, p) => sum + p.value * p.count, 0);
    return multiplier
      ? [
          {
            game: "quick" as const,
            mode: "camp",
            numbers: [],
            camp: c.camp,
            multiplier,
            chips,
          },
        ]
      : [];
  });
  const weight = tickets.reduce((sum, t) => sum + t.multiplier, 0);
  const u = rawDecimal(units(rules.unitU, 6) * BigInt(weight));
  const paidFor = (weight: number) =>
    convertU(
      rawDecimal(units(rules.unitU, 6) * BigInt(weight)),
      state.rules.price,
      config.token.decimals,
    );
  const paid = tickets.reduce((sum, t) => sum + paidFor(t.multiplier), 0n);
  const close = useCallback(() => setConfirm(null), []);
  const mine = state.orders.filter((o) => o.game === "quick");
  const currentOrders = mine
    .filter((o) => o.roundId === round.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  function place(target: Camp) {
    const previous = tickets.find((t) => t.camp === target)?.multiplier ?? 0;
    if (!open || !valid || confirm) return;
    if (previous + multiplier > 1_000_000) {
      toast("单个阵营待确认倍数最多为1,000,000，请先确认或撤回");
      return;
    }
    setCamp(target);
    const placement = {
      id: crypto.randomUUID(),
      camp: target,
      value: chipValue,
      count: multiplier / chipValue,
    };
    setDraft((previous) => ({
      roundId: round.id,
      placements: [
        ...(previous.roundId === round.id ? previous.placements : []),
        placement,
      ],
    }));
  }
  const selectedPool = state.camps.find((c) => c.camp === camp)!;
  const losers = state.camps
    .filter((c) => c.camp !== camp)
    .reduce((a, c) => a + BigInt(c.funds), 0n);
  const estimate = quickEstimate(
    paidFor(tickets.find((t) => t.camp === camp)?.multiplier ?? 0),
    tickets.find((t) => t.camp === camp)?.multiplier ?? 0,
    selectedPool.weight +
      (tickets.find((t) => t.camp === camp)?.multiplier ?? 0),
    losers +
      tickets
        .filter((t) => t.camp !== camp)
        .reduce((sum, t) => sum + paidFor(t.multiplier), 0n),
    rules.quickBurnBps,
  );
  return (
    <div className="experience-page quick-experience">
      <section
        className={`dealer-room ${shaking ? "is-shaking" : ""} ${revealed ? "is-revealed" : ""}`}
        aria-label="快速骰战牌桌"
      >
        <div className="dealer-stage">
          <div className="dealer-photograph">
            <DealerFilm round={round} />
            <CasinoLight className="casino-light--table" />
          </div>
          <div className="dealer-heading">
            <h1>快速骰战</h1>
            <p>第 {round.id} 期</p>
            <span className="scene-preview">演示预览</span>
            <div className="dealer-tagline">
              三分钟，
              <br />
              下一次幸运。
            </div>
            <small>三颗骰子，让答案揭晓。</small>
            <PreviewDraw game="quick" />
          </div>
          <div className="dealer-timing">
            <DrawTimer round={round} />
            <span>
              {revealed
                ? "本期结果已确认"
                : open
                  ? "选择阵营，等待幸运揭晓"
                  : shaking
                    ? "荷官摇骰中，参与已截止"
                    : "等待本期数据，暂未揭盅"}
            </span>
          </div>
          <div className="dealer-previous">
            <span>
              上期{" "}
              <b>
                {campLabels[classifyDice(last.result)]} ·{" "}
                {last.result.reduce((a, b) => a + b, 0)} 点
              </b>
            </span>
            <Dice values={last.result} />
          </div>
          {revealed && (
            <div className="table-result" role="status">
              <Dice values={round.result} />
              <strong>
                {campLabels[classifyDice(round.result)]}{" "}
                <span>· {round.result.reduce((a, b) => a + b, 0)} 点</span>
              </strong>
              <small>
                {round.result.join(" + ")} ·{" "}
                {round.stage === "SETTLED"
                  ? "已结算"
                  : round.stage === "NEEDS_REVIEW"
                    ? "规则待确认"
                    : "结果已确认"}
              </small>
            </div>
          )}
        </div>
        <div className="dealer-table">
          <picture className="table-material" aria-hidden="true">
            <source
              media="(max-width: 600px)"
              srcSet="/assets/curved-betting-table-mobile.webp"
            />
            <img
              src="/assets/curved-betting-table.webp"
              alt=""
              width="1600"
              height="560"
            />
          </picture>
          <div className="table-betting" role="group" aria-label="选择骰子阵营">
            {state.camps.map((c) => {
              const orders = currentOrders.filter((o) => o.camp === c.camp);
              const pending = placements.filter((p) => p.camp === c.camp);
              const confirmedWeight = orders.reduce(
                (sum, o) => sum + o.multiplier,
                0,
              );
              const pendingWeight = pending.reduce(
                (sum, p) => sum + p.value * p.count,
                0,
              );
              const groups: TableChipGroup[] = [
                ...orders.flatMap((o) =>
                  (o.chips ?? [{ value: 1, count: o.multiplier }]).map(
                    (chips, i) => ({
                      ...chips,
                      id: `${o.id}-${i}`,
                      pending: false,
                    }),
                  ),
                ),
                ...pending.map((p) => ({ ...p, pending: true })),
              ];
              return (
                <button
                  aria-pressed={camp === c.camp}
                  key={c.camp}
                  disabled={!open || !valid}
                  aria-label={`押${campLabels[c.camp]}`}
                  aria-describedby={`${c.camp}-rule ${c.camp}-pool ${c.camp}-bets`}
                  onClick={() => place(c.camp)}
                  className={`table-zone ${c.camp} ${camp === c.camp ? "selected" : ""} ${revealed && classifyDice(round.result) === c.camp ? "winner" : ""}`}
                >
                  <span className="zone-title">
                    {campLabels[c.camp]}
                    {camp === c.camp && <Check size={20} />}
                  </span>
                  <span className="zone-description" id={`${c.camp}-rule`}>
                    {c.camp === "triple"
                      ? "三骰相同"
                      : `非豹子 · ${c.camp === "small" ? "3–10" : "11–18"} 点`}
                  </span>
                  <span className="table-chip-space" aria-hidden="true">
                    <TableChips
                      groups={groups}
                      latestId={placements.at(-1)?.id}
                    />
                  </span>
                  <span id={`${c.camp}-pool`}>
                    <Money value={c.funds} digits={0} />
                    <span className="zone-people">
                      <Users size={12} />
                      {c.people} 人
                    </span>
                  </span>
                  <span
                    id={`${c.camp}-bets`}
                    className={
                      confirmedWeight || pendingWeight
                        ? "my-table-bet"
                        : "sr-only"
                    }
                  >
                    {confirmedWeight > 0 &&
                      `已下注 ${confirmedWeight.toLocaleString()} 倍`}
                    {confirmedWeight > 0 && pendingWeight > 0 && " · "}
                    {pendingWeight > 0 &&
                      `待确认 ${pendingWeight.toLocaleString()} 倍`}
                    {!confirmedWeight && !pendingWeight && "尚未放置筹码"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="table-console">
            <div
              className="table-instruction"
              aria-live="polite"
              aria-atomic="true"
            >
              <span>
                {!open
                  ? "本期参与已截止"
                  : !valid
                    ? "请输入有效倍数"
                    : placements.length > 0
                      ? `待确认 ${placements.length} 组 · ${weight.toLocaleString()}倍`
                      : "选择筹码，点击桌面放置"}
              </span>
              <small>
                {open
                  ? `${rules.unitU} U / 倍 · 点击桌面连续累加`
                  : "未确认筹码不会参与本期"}
              </small>
              {placements.length > 0 && (
                <button
                  className="table-undo"
                  disabled={!open}
                  onClick={() =>
                    setDraft({
                      roundId: round.id,
                      placements: placements.slice(0, -1),
                    })
                  }
                >
                  <Undo2 size={13} />
                  撤回上一组
                </button>
              )}
            </div>
            <div className="chip-rack" role="group" aria-label="选择筹码">
              <img
                className="chip-rack-material"
                src="/assets/table-chip-tray.webp"
                alt=""
                width="900"
                height="300"
                aria-hidden="true"
              />
              {chipValues.map((n, index) => (
                <button
                  key={n}
                  style={{ left: `${17.5 + index * 21.2}%` }}
                  disabled={!open}
                  aria-label={`${n} 倍筹码`}
                  aria-pressed={chipValue === n}
                  className={chipValue === n ? "selected" : ""}
                  onClick={() => {
                    setChipValue(n);
                    setMultiplier(n);
                  }}
                >
                  <img
                    src={`/assets/table-chip-${n}.webp`}
                    alt=""
                    width="256"
                    height="192"
                  />
                </button>
              ))}
            </div>
            <div className="table-cost">
              <span>
                本次待确认 · {weight.toLocaleString()} 倍{" "}
                <strong>{Number(u).toLocaleString()} U</strong>
              </span>
              <Money value={paid} />
            </div>
            <label className="custom-chip">
              <input
                aria-label="自定义倍数"
                aria-invalid={!valid}
                type="number"
                min="1"
                max="1000000"
                value={Number.isNaN(multiplier) ? "" : multiplier}
                disabled={!open}
                onChange={(e) => {
                  setChipValue(1);
                  setMultiplier(e.target.valueAsNumber);
                }}
              />
              <span>倍</span>
            </label>
            <button
              className="button primary table-confirm"
              disabled={!placements.length || !open}
              onClick={() =>
                setConfirm({
                  roundId: round.id,
                  placements: [...placements],
                  tickets,
                })
              }
            >
              {open
                ? "统一确认筹码"
                : revealed
                  ? "本期已开奖"
                  : "已封盘，等待开奖"}
              {open && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </section>
      <RecentDraws game="quick" />
      <div className="table-settlement-note">
        <span>
          <Flame size={17} />
          仅净盈利销毁 {rules.quickBurnBps / 100}% · 本金返还 · 浮动奖池
        </span>
        <span>
          {estimate && losers > 0n ? (
            <>
              若{campLabels[camp]}胜出，参考到账{" "}
              <Money value={estimate.payout} />
            </>
          ) : (
            "暂无参考回报"
          )}
        </span>
        <Link to="/pools">
          玩法规则 <ArrowRight size={14} />
        </Link>
      </div>
      <section className="panel records-panel">
        <div className="panel-heading">
          <div className="tabs">
            <button
              className={recordTab === "all" ? "active" : ""}
              onClick={() => setRecordTab("all")}
            >
              最近开奖
            </button>
            <button
              className={recordTab === "mine" ? "active" : ""}
              onClick={() => setRecordTab("mine")}
            >
              我的参与 {mine.length > 0 && mine.length}
            </button>
          </div>
          <Link to={recordTab === "all" ? "/history?game=quick" : "/account"}>
            查看全部 <ChevronDown size={14} />
          </Link>
        </div>
        {recordTab === "all" ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>期号</th>
                  <th>开奖结果</th>
                  <th>总点数</th>
                  <th>胜出阵营</th>
                  <th>销毁 luck</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {state.history
                  .filter((h) => h.game === "quick")
                  .slice(0, 5)
                  .map((h) => (
                    <tr key={h.id}>
                      <td>#{h.id}</td>
                      <td>
                        <Dice values={h.result} />
                      </td>
                      <td>{h.result.reduce((a, b) => a + b, 0)}</td>
                      <td>
                        <Badge tone="gold">
                          {campLabels[classifyDice(h.result)]}
                        </Badge>
                      </td>
                      <td>
                        <Money value={h.burn} />
                      </td>
                      <td>
                        <Badge>已结算</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : mine.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>期号</th>
                  <th>阵营</th>
                  <th>支付本金</th>
                  <th>税前净盈利</th>
                  <th>销毁</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {mine.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td>#{o.roundId}</td>
                    <td>{campLabels[o.camp!]}</td>
                    <td>
                      <Money value={o.paid} />
                    </td>
                    <td>
                      <Money value={o.profit} />
                    </td>
                    <td>
                      <Money value={o.burn} />
                    </td>
                    <td>
                      <ClaimStatus status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="compact-empty">
            还没有参与记录，选择一个阵营开始体验。
          </div>
        )}
      </section>
      <p className="scene-footnote">
        人物为 AI 生成的视觉演示 · 参考金额随奖池变化，最终以结算为准 ·
        空胜阵营处理规则待确认
      </p>
      {confirm && (
        <QuickConfirm
          tickets={confirm.tickets}
          roundId={confirm.roundId}
          onClose={close}
          onSuccess={() => {
            const ids = new Set(confirm.placements.map((p) => p.id));
            setDraft((previous) => ({
              ...previous,
              placements: previous.placements.filter((p) => !ids.has(p.id)),
            }));
          }}
        />
      )}
    </div>
  );
}
