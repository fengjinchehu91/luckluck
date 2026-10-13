import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Search,
} from "lucide-react";
import { campLabels } from "../config";
import { useApp } from "../hooks";
import { classifyDice } from "../lib/math";
import type { Game, HistoryRound } from "../types";
import {
  Badge,
  Ball,
  Dice,
  Empty,
  Modal,
  Money,
  PageHead,
  Status,
} from "../components/ui";
export default function History() {
  const { history } = useApp(),
    [params, setParams] = useSearchParams(),
    initial = params.get("round");
  const [game, setGame] = useState<Game>(
      params.get("game") === "quick" ? "quick" : "daily",
    ),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [detail, setDetail] = useState<HistoryRound | null>(
      history.find((h) => h.id === initial) || null,
    );
  const records = history.filter(
      (h) =>
        h.game === game &&
        h.id.toLowerCase().includes(search.toLowerCase().replace("#", "")),
    ),
    pages = Math.max(1, Math.ceil(records.length / 8));
  const close = useCallback(() => setDetail(null), []);
  function switchGame(g: Game) {
    setGame(g);
    setPage(1);
    setSearch("");
    setParams({ game: g });
  }
  return (
    <div className="inner-page">
      <PageHead
        title="幸运留下的每一个足迹。"
        description="查看往期开奖、资金分配与滚存记录。每一期，清清楚楚。"
      >
        <Badge>
          <CalendarDays size={14} />
          演示历史
        </Badge>
      </PageHead>
      <section className="panel history-panel">
        <div className="history-toolbar">
          <div className="tabs">
            <button
              className={game === "daily" ? "active" : ""}
              onClick={() => switchGame("daily")}
            >
              每日挑战
            </button>
            <button
              className={game === "quick" ? "active" : ""}
              onClick={() => switchGame("quick")}
            >
              快速挑战
            </button>
          </div>
          <label className="search-input">
            <Search size={17} />
            <input
              aria-label="按期号搜索"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="输入期号搜索"
            />
          </label>
        </div>
        {records.length ? (
          <>
            <div className="table-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>期号 / 开奖时间</th>
                    <th>开奖结果</th>
                    <th>{game === "daily" ? "奖金释放" : "胜出阵营 / 奖金"}</th>
                    <th>{game === "daily" ? "luck 滚存" : "luck 销毁"}</th>
                    <th>状态</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {records.slice((page - 1) * 8, page * 8).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>#{r.id}</strong>
                        <small>
                          {new Date(r.at).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </td>
                      <td>
                        {game === "daily" ? (
                          <div className="ball-row small">
                            {r.result.map((n, i) => (
                              <Ball n={n} key={n} small gold={i === 5} />
                            ))}
                          </div>
                        ) : (
                          <div className="history-dice">
                            <Dice values={r.result} />
                            <span>
                              {r.result.reduce((a, b) => a + b, 0)} 点
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {game === "daily" ? (
                          <>
                            <Money value={r.releaseUsdt} unit="USDT" />
                            <Money value={r.releaseLuck} digits={0} />
                          </>
                        ) : (
                          <>
                            <Badge tone="gold">
                              {campLabels[classifyDice(r.result)]}
                            </Badge>
                            <Money value={r.releaseLuck} digits={0} />
                          </>
                        )}
                      </td>
                      <td>
                        <Money
                          value={game === "daily" ? r.rolledLuck : r.burn}
                          digits={0}
                        />
                      </td>
                      <td>
                        <Status stage={r.stage} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`查看 ${r.id} 详情`}
                          onClick={() => setDetail(r)}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>共 {records.length} 期记录</span>
              <div>
                <button
                  className="icon-button"
                  aria-label="上一页"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ArrowLeft size={16} />
                </button>
                <span>
                  {page} / {pages}
                </span>
                <button
                  className="icon-button"
                  aria-label="下一页"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <Empty
            title="没有找到这个期号"
            text="试试其他期号，或清空搜索查看全部记录。"
            action={false}
          />
        )}
      </section>
      <p className="info-note history-note">
        所有记录均为示例数据，仅展示演示 ID，不包含真实交易 hash 或随机数请求。
      </p>
      {detail && (
        <Modal
          title={`${detail.game === "daily" ? "每日" : "快速"}挑战 · ${detail.id}`}
          onClose={close}
          wide
        >
          <div className="detail-result">
            {detail.game === "daily" ? (
              <div className="ball-row">
                {detail.result.map((n) => (
                  <Ball key={n} n={n} gold />
                ))}
              </div>
            ) : (
              <>
                <Dice values={detail.result} />
                <strong>
                  {campLabels[classifyDice(detail.result)]} ·{" "}
                  {detail.result.reduce((a, b) => a + b, 0)} 点
                </strong>
              </>
            )}
            <Status stage={detail.stage} />
          </div>
          <div className="key-row">
            <span>演示 ID</span>
            <span>{detail.demoId}</span>
          </div>
          <div className="key-row">
            <span>规则版本</span>
            <span>v{detail.ruleVersion}</span>
          </div>
          <div className="key-row">
            <span>奖金释放</span>
            <Money value={detail.releaseLuck} />
          </div>
          <div className="key-row">
            <span>luck 销毁</span>
            <Money value={detail.burn} />
          </div>
          {detail.tiers && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>奖档</th>
                    <th>已释放 USDT / luck</th>
                    <th>滚存 USDT / luck</th>
                    <th>权重</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.tiers.map((t) => (
                    <tr key={t.size}>
                      <td>
                        选 {t.size} 中 {t.size}
                      </td>
                      <td>
                        <Money value={t.releasedUsdt} unit="USDT" />
                        <Money value={t.releasedLuck} digits={0} />
                      </td>
                      <td>
                        <Money value={t.rolledUsdt} unit="USDT" />
                        <Money value={t.rolledLuck} digits={0} />
                      </td>
                      <td>{t.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {detail.camps?.map((c) => (
            <div className="key-row" key={c.camp}>
              <span>
                {campLabels[c.camp]} 阵营 · 权重 {c.weight}
              </span>
              <Money value={c.funds} />
            </div>
          ))}
          <p className="info-note">
            演示结算记录，无链上凭证。{detail.game === "quick" && "余数留存："}
            {detail.game === "quick" && (
              <Money value={detail.rolledLuck} digits={6} />
            )}
          </p>
        </Modal>
      )}
    </div>
  );
}
