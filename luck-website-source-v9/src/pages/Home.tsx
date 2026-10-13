import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Flame,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { campLabels, config } from "../config";
import { useApp } from "../hooks";
import { classifyDice, convertU, decimal } from "../lib/math";
import { Badge, Ball, Dice, Money } from "../components/ui";
import { DrawTimer, Wheel } from "../components/DrawStage";
import { CasinoLight } from "../components/CasinoLight";
import { TiltCard } from "../components/TiltCard";
import { LobbyHeadline } from "../components/LobbyHeadline";
export default function Home() {
  const state = useApp(),
    dailyLast = state.history.find((h) => h.game === "daily")!,
    quickLast = state.history.find((h) => h.game === "quick")!;
  const usdt = state.tiers.reduce((a, t) => a + BigInt(t.usdt), 0n),
    luck = state.tiers.reduce((a, t) => a + BigInt(t.luck), 0n);
  return (
    <div className="home-page lobby-page">
      <section className="lobby-intro">
        <LobbyHeadline />
        <div className="lobby-quote">
          <span>
            luck 参考价格 <Badge>演示</Badge>
          </span>
          <strong>${state.rules.price}</strong>
          <small>
            1 U ≈{" "}
            {decimal(
              convertU("1", state.rules.price, config.token.decimals),
              config.token.decimals,
              2,
            )}{" "}
            luck
          </small>
        </div>
      </section>
      <section className="lobby-games" aria-label="选择游戏">
        <TiltCard className="lobby-game lobby-daily">
          <div className="lobby-game-title">
            <div>
              <h2>
                每日开奖 <span>20 选 6</span>
              </h2>
              <p>0–19，选出属于你的幸运组合。</p>
            </div>
            <DrawTimer round={state.daily} />
          </div>
          <Link
            to="/daily"
            className="lobby-scene lobby-wheel-scene"
            aria-label="进入每日开奖转盘"
          >
            <img
              className="lobby-stage-bg"
              src="/assets/draw-stage.png"
              alt=""
            />
            <CasinoLight className="casino-light--lobby" />
            <Wheel miniature />
            <span className="lobby-scene-caption">一场每日开启的幸运仪式</span>
          </Link>
          <div className="lobby-game-bottom">
            <div className="lobby-prize">
              <span>本期双奖池</span>
              <Money value={usdt} unit="USDT" />
              <Money value={luck} digits={0} />
            </div>
            <Link className="button primary" to="/daily">
              进入转盘 <ArrowRight size={18} />
            </Link>
          </div>
          <div className="lobby-game-foot">
            <span>
              <Flame size={13} />
              {state.daily.rules.dailyBurnBps / 100}% 参与销毁
            </span>
            <span>普通 / 复式 · 双份奖励</span>
          </div>
        </TiltCard>
        <TiltCard className="lobby-game lobby-quick">
          <div className="lobby-game-title">
            <div>
              <h2>
                快速骰战 <span>三分钟一期</span>
              </h2>
              <p>三颗骰子，让答案在牌桌上揭晓。</p>
            </div>
            <DrawTimer round={state.quick} />
          </div>
          <Link
            to="/quick"
            className="lobby-scene lobby-dealer-scene"
            aria-label="进入荷官骰子牌桌"
          >
            <img
              src="/assets/dealer-video-idle.jpg"
              alt="白衬衫荷官与墨绿摇骰牌桌"
            />
            <CasinoLight className="casino-light--table casino-light--lobby" />
            <span className="lobby-scene-caption">
              最后 10 秒，进入摇骰时刻
            </span>
          </Link>
          <div className="lobby-game-bottom">
            <div className="lobby-camps">
              {state.camps.map((c) => (
                <div key={c.camp}>
                  <strong>{campLabels[c.camp]}</strong>
                  <Money value={c.funds} digits={0} />
                </div>
              ))}
            </div>
            <Link className="button primary" to="/quick">
              入席参与 <ArrowRight size={18} />
            </Link>
          </div>
          <div className="lobby-game-foot">
            <span>
              <Flame size={13} />
              净盈利销毁 {state.quick.rules.quickBurnBps / 100}%
            </span>
            <span>本金返还 · 浮动奖池</span>
          </div>
        </TiltCard>
      </section>
      <section className="stats-bar" aria-label="平台演示统计">
        {[
          {
            icon: Users,
            label: "累计参与人次",
            value: state.stats.participants.toLocaleString(),
            unit: "人次",
          },
          {
            icon: CircleDollarSign,
            label: "累计发放 USDT",
            value: decimal(state.stats.usdtPaid, 6, 2),
            unit: "USDT",
          },
          {
            icon: Trophy,
            label: "累计发放 luck",
            value: decimal(state.stats.luckPaid, config.token.decimals, 0),
            unit: "luck",
          },
          {
            icon: Flame,
            label: "累计销毁 luck",
            value: decimal(state.stats.luckBurned, config.token.decimals, 0),
            unit: "luck",
          },
        ].map(({ icon: Icon, label, value, unit }) => (
          <div key={label}>
            <span className="stat-label">
              <Icon size={16} />
              {label}
            </span>
            <strong>
              {value}
              <small>{unit}</small>
            </strong>
          </div>
        ))}
      </section>
      <section className="latest-section">
        <div className="section-lead">
          <div>
            <h2>幸运，正在发生</h2>
            <span>最近开奖</span>
          </div>
          <Link to="/history">
            查看全部 <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="latest-grid">
          <div className="latest-result">
            <div className="latest-result-info">
              <span className="latest-icon">
                <Trophy size={20} />
              </span>
              <div>
                <h3>
                  每日挑战 <Badge>已结算</Badge>
                </h3>
                <p>
                  #{dailyLast.id} ·{" "}
                  {new Date(dailyLast.at).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </div>
            <div className="ball-row small">
              {dailyLast.result.map((n, i) => (
                <Ball key={n} n={n} small gold={i === 5} />
              ))}
            </div>
            <Link
              to={`/history?game=daily&round=${dailyLast.id}`}
              aria-label="查看每日开奖详情"
            >
              <ChevronRight size={19} />
            </Link>
          </div>
          <div className="latest-result">
            <div className="latest-result-info">
              <span className="latest-icon">
                <Zap size={20} />
              </span>
              <div>
                <h3>
                  快速挑战 <Badge>已结算</Badge>
                </h3>
                <p>
                  #{quickLast.id} ·{" "}
                  {new Date(quickLast.at).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <Dice values={quickLast.result} />
            <span className="winning-camp">
              {campLabels[classifyDice(quickLast.result)]}
              <small>{quickLast.result.reduce((a, b) => a + b, 0)} 点</small>
            </span>
            <Link
              to={`/history?game=quick&round=${quickLast.id}`}
              aria-label="查看快速开奖详情"
            >
              <ChevronRight size={19} />
            </Link>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <span>
          <Check size={14} />U 计价 · luck 支付
        </span>
        <span>
          <Check size={14} />
          每日双金库独立记账
        </span>
        <span>
          <Check size={14} />
          快速挑战浮动奖池
        </span>
        <Link to="/pools">
          了解完整规则 <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
