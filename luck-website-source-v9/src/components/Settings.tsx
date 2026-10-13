import { useState } from "react";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { useApp } from "../hooks";
import { mock, service } from "../services";
import { validateRules } from "../lib/math";
import type { Game } from "../types";
import { Modal, Spinner, Status, useToast } from "./ui";
export function DevSettings({ onClose }: { onClose: () => void }) {
  const state = useApp(),
    toast = useToast();
  const [json, setJson] = useState(JSON.stringify(state.rules, null, 2)),
    [tab, setTab] = useState("rounds"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [valid, setValid] = useState(false),
    [match, setMatch] = useState(true);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    OPEN: "关闭参与",
    CLOSED: "请求演示随机数",
    RANDOMNESS_PENDING: "生成演示结果",
    DRAWN: "开始演示结算",
    SETTLING: "完成演示结算",
    SETTLED: "开启下一期",
    NEEDS_REVIEW: "规则待确认",
  };
  return (
    <Modal title="开发设置" onClose={onClose} wide>
      <div className="tabs">
        <button
          className={tab === "rounds" ? "active" : ""}
          onClick={() => setTab("rounds")}
        >
          演示期次
        </button>
        <button
          className={tab === "config" ? "active" : ""}
          onClick={() => setTab("config")}
        >
          配置同步
        </button>
      </div>
      {tab === "rounds" ? (
        <>
          <p className="modal-description left">
            仅用于预览。手动推进状态，体验参与后开奖、结算和领奖的完整过程。
          </p>
          {(["daily", "quick"] as Game[]).map((game) => (
            <div key={game} className="dev-round">
              <div>
                <strong>{game === "daily" ? "每日挑战" : "快速挑战"}</strong>
                <small>#{state[game].id}</small>
                <Status stage={state[game].stage} />
              </div>
              <button
                className="button secondary"
                disabled={busy || state[game].stage === "NEEDS_REVIEW"}
                onClick={() => act(() => mock.advance(game, match))}
              >
                {busy ? <Spinner /> : <ArrowRight size={16} />}{" "}
                {labels[state[game].stage]}
              </button>
            </div>
          ))}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={match}
              onChange={(e) => setMatch(e.target.checked)}
            />
            生成结果时让我的最新订单命中（仅开发演示）
          </label>
          <p className="info-note">
            演示结算完成后，到个人中心领取奖励。演示倒计时会自动推进开奖与结算，不会转移真实资金。骰子开奖前 10 秒封盘并开始摇骰。
          </p>
        </>
      ) : (
        <>
          <p className="modal-description left">
            编辑或粘贴
            JSON，先校验再应用。经济规则仅在后续生效期次使用，当前期次保留独立快照。
          </p>
          <label className="field-label" htmlFor="config-json">
            统一演示配置
          </label>
          <textarea
            id="config-json"
            spellCheck={false}
            value={json}
            onChange={(e) => {
              setJson(e.target.value);
              setValid(false);
            }}
          />
          <div className="setting-actions">
            <button
              className="button secondary"
              onClick={() => {
                try {
                  validateRules(JSON.parse(json));
                  setValid(true);
                  setError("");
                } catch (e) {
                  setValid(false);
                  setError((e as Error).message);
                }
              }}
            >
              {valid ? <Check size={15} /> : null}{" "}
              {valid ? "校验通过" : "校验配置"}
            </button>
            <button
              className="button primary"
              disabled={!valid || busy}
              onClick={() =>
                act(async () => {
                  await service.syncRules(JSON.parse(json));
                  toast("配置已同步，经济规则按生效期次应用");
                })
              }
            >
              应用配置
            </button>
            <button
              className="button subtle"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await service.syncRules();
                  setJson(JSON.stringify(await service.getRules(), null, 2));
                  toast("展示数据已从统一配置源刷新");
                })
              }
            >
              <RefreshCw size={15} />
              一键同步
            </button>
          </div>
          <p className="info-note">
            当前版本 {state.rules.version}
            。品牌资源和参考价格立即刷新；同步网站展示不代表修改已部署合约。
          </p>
        </>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
