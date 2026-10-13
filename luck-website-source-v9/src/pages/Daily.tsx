import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleHelp,
  Flame,
  Shuffle,
  Trash2,
  Trophy,
} from "lucide-react";
import { config, DAILY_NUMBERS } from "../config";
import { useApp } from "../hooks";
import { convertU, rawDecimal, ticketInfo, units } from "../lib/math";
import type { Ticket } from "../types";
import { Ball, Money, Multiplier } from "../components/ui";
import { Confirm } from "../components/Confirm";
import { TierTable } from "../components/TierTable";
import { CasinoLight } from "../components/CasinoLight";
import {
  DrawTimer,
  PreviewDraw,
  RecentDraws,
  Wheel,
} from "../components/DrawStage";

export default function Daily() {
  const state = useApp(),
    rules = state.daily.rules;
  const [mode, setMode] = useState("normal"),
    [numbers, setNumbers] = useState<number[]>([]),
    [multiplier, setMultiplier] = useState(1),
    [confirm, setConfirm] = useState(false);
  const pack = rules.packages.find((p) => `${p.choose}包${p.size}` === mode),
    max = pack?.choose ?? 6;
  const ticket: Ticket = { game: "daily", mode, numbers, multiplier };
  let valid = false,
    error = "";
  try {
    ticketInfo(ticket, rules);
    valid = true;
  } catch (e) {
    error = (e as Error).message;
  }
  const bets = pack?.bets ?? 1;
  const safeMultiplier =
    Number.isSafeInteger(multiplier) &&
    multiplier > 0 &&
    multiplier <= 1_000_000
      ? multiplier
      : 0;
  const u = rawDecimal(units(rules.unitU, 6) * BigInt(bets * safeMultiplier));
  const token = convertU(u, state.rules.price, config.token.decimals);
  const close = useCallback(() => setConfirm(false), []);
  function random() {
    const shuffled = [...DAILY_NUMBERS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setNumbers(shuffled.slice(0, max).sort((a, b) => a - b));
  }
  return (
    <div className="experience-page daily-experience">
      <div className="daily-room">
        <section className="draw-stage" aria-label="每日开奖舞台">
          <img className="stage-backdrop" src="/assets/draw-stage.png" alt="" />
          <CasinoLight />
          <div className="stage-heading">
            <div>
              <h1>
                每日开奖 <span>20 选 6</span>
              </h1>
              <p>把幸运，握在自己手里。</p>
              <small>第 {state.daily.id} 期 · 号码 0–19</small>
            </div>
            <DrawTimer round={state.daily} />
          </div>
          <Wheel round={state.daily} />
          <div className="stage-tools">
            <span>演示预览</span>
            <PreviewDraw game="daily" />
          </div>
        </section>
        <section className="selection-rail" aria-label="选号与参与">
          <div className="rail-vault">
            <span>本期奖励金库</span>
            <Money
              value={state.tiers.reduce((a, t) => a + BigInt(t.usdt), 0n)}
              unit="USDT"
            />
            <Money
              value={state.tiers.reduce((a, t) => a + BigInt(t.luck), 0n)}
              digits={0}
            />
          </div>
          <div className="rail-heading">
            <h2>我的幸运号码</h2>
            <Link to="/pools" aria-label="查看选号规则">
              <CircleHelp size={17} />
            </Link>
          </div>
          <div className="play-mode">
            <button
              className={mode === "normal" ? "active" : ""}
              onClick={() => {
                setMode("normal");
                setNumbers([]);
              }}
            >
              普通玩法
            </button>
            <button
              className={mode !== "normal" ? "active" : ""}
              onClick={() => {
                setMode("3包2");
                setNumbers([]);
              }}
            >
              复式玩法
            </button>
          </div>
          {mode !== "normal" && (
            <div className="package-modes">
              {rules.packages.map((p) => (
                <button
                  key={p.choose}
                  className={
                    mode === `${p.choose}包${p.size}` ? "selected" : ""
                  }
                  onClick={() => {
                    setMode(`${p.choose}包${p.size}`);
                    setNumbers([]);
                  }}
                >
                  {p.choose}包{p.size}
                  <small>{p.bets} 注</small>
                </button>
              ))}
            </div>
          )}
          <div className="number-grid-label">
            <span>
              {pack
                ? `选 ${pack.choose} 个号码，组合 ${pack.bets} 注`
                : "从 0–19 中选择 2–6 个号码"}
            </span>
            <span>
              已选 <b>{numbers.length}</b>/{max}
            </span>
          </div>
          <div className="number-grid" aria-label="选择 0 至 19 号码">
            {DAILY_NUMBERS.map((n) => (
              <button
                key={n}
                aria-label={`号码 ${n}`}
                aria-pressed={numbers.includes(n)}
                className={numbers.includes(n) ? "selected" : ""}
                disabled={numbers.length >= max && !numbers.includes(n)}
                onClick={() =>
                  setNumbers(
                    numbers.includes(n)
                      ? numbers.filter((x) => x !== n)
                      : [...numbers, n].sort((a, b) => a - b),
                  )
                }
              >
                {n}
              </button>
            ))}
          </div>
          <div className="number-actions">
            <button onClick={random}>
              <Shuffle size={15} />
              机选一组
            </button>
            <button disabled={!numbers.length} onClick={() => setNumbers([])}>
              <Trash2 size={14} />
              清空
            </button>
          </div>
          <div className="selected-brief">
            <span>已选号码</span>
            <div>
              {numbers.length ? (
                numbers.map((n) => <Ball n={n} small gold key={n} />)
              ) : (
                <small>点击号码，开始选择</small>
              )}
            </div>
          </div>
          <Multiplier value={multiplier} set={setMultiplier} />
          <div className="rail-payment">
            <div>
              <span>
                {bets} 注 × {safeMultiplier} 倍
              </span>
              <strong>
                {Number(u).toLocaleString()} <small>U</small>
              </strong>
            </div>
            <div>
              <span>参考支付</span>
              <Money value={token} />
            </div>
          </div>
          <button
            className="button primary full large"
            disabled={!valid || state.daily.stage !== "OPEN"}
            onClick={() => setConfirm(true)}
          >
            {state.daily.stage !== "OPEN" ? "本期已截止" : "确认号码，获取报价"}
            <ArrowRight size={17} />
          </button>
          <p className="rail-hint">
            {state.daily.stage !== "OPEN"
              ? "本期投注已结束，可先挑选下一组幸运号码。"
              : valid
                ? "以确认页的锁定报价为准 · 演示参与"
                : error}
          </p>
        </section>
      </div>
      <RecentDraws game="daily" />
      <div className="daily-bottom">
        <section className="panel reward-details">
          <div className="panel-heading">
            <h2>
              <Trophy size={18} />
              五档奖池，双份奖励
            </h2>
            <Link to="/pools">
              分配规则 <ArrowRight size={14} />
            </Link>
          </div>
          <TierTable />
        </section>
        <section className="daily-rule-note">
          <Flame size={22} />
          <h2>每一次参与，都有回响。</h2>
          <p>
            所选号码全部命中，即参与对应奖档分配。同时获得 USDT 与 luck
            两份奖励。
          </p>
          <div>
            <strong>{rules.dailyBurnBps / 100}%</strong>
            <span>参与 luck 销毁</span>
            <strong>{100 - rules.dailyBurnBps / 100}%</strong>
            <span>进入奖励金库</span>
          </div>
          <p>
            有人中奖释放该档累计余额的 {rules.releaseBps / 100}
            %，无人中奖全额滚存。
          </p>
        </section>
      </div>
      {confirm && <Confirm ticket={ticket} onClose={close} />}
    </div>
  );
}
