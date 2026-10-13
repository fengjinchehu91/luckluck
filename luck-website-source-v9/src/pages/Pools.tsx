import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  Flame,
  Info,
  Layers3,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";
import { config } from "../config";
import { useApp } from "../hooks";
import { AddressLink, Badge, Money, PageHead } from "../components/ui";
import { TierTable } from "../components/TierTable";
export default function Pools() {
  const { daily, quick, tiers, ledger } = useApp(),
    rules = daily.rules;
  return (
    <div className="inner-page">
      <PageHead
        title="每一份幸运，都有迹可循。"
        description="了解奖池的来源、分配与滚存。两套游戏，各自独立记账。"
      >
        <Badge>
          <ShieldCheck size={14} />
          规则 v{rules.version}
        </Badge>
      </PageHead>
      <section className="pool-overview">
        <div className="panel pool-overview-card">
          <div className="panel-heading">
            <h2>
              <Coins size={19} />
              USDT 奖励金库
            </h2>
            <Badge>每日挑战</Badge>
          </div>
          <Money
            value={tiers.reduce((a, t) => a + BigInt(t.usdt), 0n)}
            unit="USDT"
          />
          <p>来源：交易税的 1% 归集并转换为 USDT</p>
          <small>归集接口待接入 · 当前为演示余额</small>
        </div>
        <div className="panel pool-overview-card">
          <div className="panel-heading">
            <h2>
              <Layers3 size={19} />
              luck 奖励金库
            </h2>
            <Badge>每日挑战</Badge>
          </div>
          <Money
            value={tiers.reduce((a, t) => a + BigInt(t.luck), 0n)}
            digits={0}
          />
          <p>来源：参与实际支付 luck 的 {100 - rules.dailyBurnBps / 100}%</p>
          <small>其余 {rules.dailyBurnBps / 100}% 销毁 · 奖金不额外扣费</small>
        </div>
      </section>
      <section className="panel pools-table-panel">
        <div className="panel-heading">
          <h2>
            <Trophy size={18} />
            五档奖池，独立滚存
          </h2>
          <span className="muted">预计释放比例 {rules.releaseBps / 100}%</span>
        </div>
        <div className="table-scroll">
          <TierTable detailed />
        </div>
        <p className="info-note">
          <Info size={14} />
          预计金额不代表已经中奖。按累计奖池余额计算；各档无人中奖时 100% 滚存。
        </p>
      </section>
      <section className="rules-grid">
        <article className="panel rule-article">
          <h2>
            <Trophy size={20} />
            每日挑战怎么玩
          </h2>
          <p>
            从 0–19 中选择号码，开奖产生 6
            个不重复号码。所选全部命中，才算该档中奖。
          </p>
          <dl>
            <div>
              <dt>普通玩法</dt>
              <dd>
                选择 2–6 个号码，选几个就参与对应奖档，不自动叠加其他奖级。
              </dd>
            </div>
            <div>
              <dt>复式玩法</dt>
              <dd>
                3包2、4包3、5包4、6包5、7包6，分别生成 3、4、5、6、7 注。仅 7包6
                允许选择 7 个号码。
              </dd>
            </div>
            <div>
              <dt>中奖分配</dt>
              <dd>
                复式命中 h 个、每注 k 个号码，中奖注数为 C(h,k)。同档按中奖注数
                × 倍数，瓜分两份奖励。
              </dd>
            </div>
            <div>
              <dt>独立滚存</dt>
              <dd>
                各档分别分配新入库资金；有人中奖释放累计余额{" "}
                {rules.releaseBps / 100}%，其余滚存，不重新分配旧余额。
              </dd>
            </div>
          </dl>
          <Link to="/daily" className="text-link">
            开始每日挑战 <ArrowRight size={15} />
          </Link>
        </article>
        <article className="panel rule-article">
          <h2>
            <Zap size={20} />
            快速挑战怎么玩
          </h2>
          <p>
            每 3 分钟一期，选择小、豹子或大。参与支付 luck，最终只结算 luck。
          </p>
          <dl>
            <div>
              <dt>判定顺序</dt>
              <dd>
                先判豹子：三骰相同即豹子。其余总点数 3–10 为小，11–18
                为大；1-1-1、6-6-6 均只算豹子。
              </dd>
            </div>
            <div>
              <dt>本金返还</dt>
              <dd>
                赢家获得自己实际支付的 luck 本金。失败阵营资金形成税前净盈利池。
              </dd>
            </div>
            <div>
              <dt>净盈利分配</dt>
              <dd>
                按参与时锁定的有效倍数分配，净盈利的{" "}
                {quick.rules.quickBurnBps / 100}%
                销毁，其余到账。本金不扣费，没有固定赔率。
              </dd>
            </div>
            <div>
              <dt>空胜阵营</dt>
              <dd>
                处理规则待确认。演示停在待处理状态，不自行退款、销毁或结转。
              </dd>
            </div>
          </dl>
          <Link to="/quick" className="text-link">
            开始快速挑战 <ArrowRight size={15} />
          </Link>
        </article>
      </section>
      <section className="rules-grid">
        <article className="panel rule-article compact-article">
          <h2>
            <Flame size={18} />U 计价，不等于 USDT 付款
          </h2>
          <p>
            所需 luck = U 计价总额 ÷ luck 的 USDT
            报价。最终以确认时的锁定价格为准，报价过期后需重新确认。
          </p>
          <p>
            金额按最小单位整数计算，U 换 luck
            向上取整。各奖池分配向下取整，余数保留在对应金库或结算记录，不丢失资金。
          </p>
          <p className="muted">
            历史订单保留原始本金和有效权重。U 计价不代表领奖时奖励价值固定。
          </p>
        </article>
        <article className="panel rule-article compact-article">
          <h2>
            <ShieldCheck size={18} />
            公开信息
          </h2>
          <AddressLink label="luck Token" address={config.token.address} />
          <AddressLink label="每日挑战合约" address={config.contracts.daily} />
          <AddressLink label="快速挑战合约" address={config.contracts.quick} />
          <div className="key-row">
            <span>规则版本 / 生效范围</span>
            <strong>
              v{rules.version} / {rules.effectiveRound}
            </strong>
          </div>
          <div className="key-row">
            <span>生效时间</span>
            <span>
              {new Date(rules.effectiveAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <div className="key-row">
            <span>更新时间</span>
            <span>{new Date(rules.updatedAt).toLocaleDateString("zh-CN")}</span>
          </div>
          <p className="info-note">合约保护、真实 VRF 与实际结算尚未接入。</p>
        </article>
      </section>
      <section className="panel records-panel">
        <div className="panel-heading">
          <h2>公开资金流水</h2>
          <Badge>演示记录</Badge>
        </div>
        {ledger.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>金额</th>
                  <th>演示 ID</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 10).map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.at).toLocaleTimeString("zh-CN")}</td>
                    <td>{l.description}</td>
                    <td>
                      <Money value={l.amount} />
                    </td>
                    <td className="muted">{l.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="compact-empty">
            完成一次演示参与后，此处会显示对应资金流。
            <Link to="/daily">
              去体验 <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
