import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play, Triangle } from "lucide-react";
import { DAILY_NUMBERS, stageLabels, TOKEN_LOGO } from "../config";
import { useApp, useNow } from "../hooks";
import { mock } from "../services";
import type { Game, Round } from "../types";
import { Ball, useToast } from "./ui";

export function PreviewDraw({ game }: { game: Game }) {
  const state = useApp(),
    toast = useToast();
  return (
    <button
      className="preview-draw"
      disabled={state[game].stage !== "OPEN"}
      onClick={() => {
        try {
          mock.startDrawPreview(game);
          toast(
            game === "daily" ? "演示开奖即将开始" : "进入最后 10 秒摇骰演示",
          );
        } catch (e) {
          toast((e as Error).message);
        }
      }}
    >
      <Play size={13} />
      体验开奖
    </button>
  );
}

export function DrawTimer({ round }: { round: Round }) {
  const now = Math.max(useNow(), Date.now());
  const seconds = Math.max(
    0,
    Math.ceil(
      ((round.stage === "OPEN" ? round.closesAt : round.drawsAt) - now) / 1000,
    ),
  );
  const time =
    round.game === "daily"
      ? `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
      : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const label =
    round.stage === "OPEN"
      ? "距离封盘"
      : round.stage === "CLOSED"
        ? round.game === "quick"
          ? "封盘 · 摇骰中"
          : "转盘启动中"
        : round.stage === "RANDOMNESS_PENDING"
          ? "等待开奖数据"
          : stageLabels[round.stage];
  return (
    <div className={`draw-timer ${round.stage !== "OPEN" ? "drawing" : ""}`}>
      <strong>
        {seconds > 0 || round.stage === "OPEN"
          ? time
          : round.result.length
            ? "已开奖"
            : "揭晓中"}
      </strong>
      <span>{label}</span>
    </div>
  );
}

const mod = (angle: number) => ((angle % 360) + 360) % 360;
export function wheelStops(numbers: number[], start = 0) {
  let angle = start;
  return numbers.map((n) => (angle += 720 + mod(-n * 18 - angle)));
}

export function Wheel({
  round,
  miniature = false,
}: {
  round?: Round;
  miniature?: boolean;
}) {
  const rotor = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const [revealed, setRevealed] = useState(0);
  const signature = round?.result.join(",") ?? "";
  const waiting =
    round?.stage === "CLOSED" || round?.stage === "RANDOMNESS_PENDING";
  useEffect(() => {
    if (!round || miniature) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = angle.current,
      stops = wheelStops(round.result, start);
    let frame = 0,
      last = 0;
    const paint = (time: number) => {
      if (time - last < 30) {
        frame = requestAnimationFrame(paint);
        return;
      }
      last = time;
      const elapsed = Math.max(0, Date.now() - (round.resultAt ?? 0));
      let next = start;
      if (stops.length) {
        const count = reduce
          ? stops.length
          : Math.min(stops.length, Math.floor(elapsed / 3200));
        setRevealed(count);
        if (count === stops.length) next = stops[stops.length - 1];
        else {
          const previous = count ? stops[count - 1] : start;
          const progress = Math.min(1, (elapsed % 3200) / 2850);
          next =
            previous +
            (stops[count] - previous) * (1 - Math.pow(1 - progress, 4));
        }
      } else if (waiting && !reduce) next = start + time / 6;
      else setRevealed(0);
      angle.current = next;
      if (rotor.current) rotor.current.style.transform = `rotate(${next}deg)`;
      if ((waiting || (stops.length && elapsed < 19_200)) && !reduce)
        frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [round?.id, round?.resultAt, signature, waiting, miniature]);
  return (
    <div className={`wheel-experience ${miniature ? "wheel-mini" : ""}`}>
      <div className="wheel-wrap" aria-label="0 至 19 的 20 格开奖转盘">
        <Triangle
          className="wheel-pointer"
          size={45}
          fill="currentColor"
          strokeWidth={1}
          aria-hidden="true"
        />
        <div className="wheel-rotor" ref={rotor}>
          <img
            src="/assets/luck-wheel.png"
            width="1024"
            height="1024"
            alt="金色墨绿开奖转盘"
            fetchPriority={miniature ? "auto" : "high"}
          />
          <img
            className="wheel-token-logo"
            src={TOKEN_LOGO}
            alt="LUCK 代币 Logo"
          />
          <ol className="wheel-numbers" aria-label="转盘号码">
            {DAILY_NUMBERS.map((n) => (
              <li key={n} style={{ transform: `rotate(${n * 18}deg)` }}>
                <span>{n}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {!miniature && round && (
        <div className="wheel-reveal" aria-live="polite">
          <p>
            {round.result.length
              ? revealed < 6
                ? `正在揭晓第 ${revealed + 1} 个号码`
                : "本期开奖号码"
              : waiting
                ? "转盘已启动，等待开奖数据"
                : "转盘就绪 · 到点自动开奖"}
          </p>
          <div className="result-slots">
            {Array.from({ length: 6 }, (_, i) =>
              i < revealed && round.result[i] !== undefined ? (
                <Ball n={round.result[i]} gold key={i} />
              ) : (
                <span className="result-slot" key={i}>
                  —
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RecentDraws({ game }: { game: Game }) {
  const { history } = useApp();
  const records = history
    .filter((h) => h.game === game)
    .slice(0, game === "daily" ? 1 : 8);
  return (
    <div className="stage-history">
      <span>{game === "daily" ? "上期开奖" : "最近开奖"}</span>
      <div className="stage-history-results">
        {records.map((r) => (
          <Link
            to={`/history?game=${game}&round=${r.id}`}
            key={r.id}
            className="history-result-link"
          >
            {game === "daily" ? (
              <div className="ball-row">
                {r.result.map((n) => (
                  <Ball small n={n} key={n} />
                ))}
              </div>
            ) : (
              <>
                <strong
                  className={`history-camp ${r.result.every((n) => n === r.result[0]) ? "triple" : r.result.reduce((a, b) => a + b, 0) >= 11 ? "big" : "small"}`}
                >
                  {r.result.every((n) => n === r.result[0])
                    ? "豹子"
                    : r.result.reduce((a, b) => a + b, 0) >= 11
                      ? "大"
                      : "小"}
                </strong>
                <small>#{r.id}</small>
              </>
            )}
          </Link>
        ))}
      </div>
      <Link to={`/history?game=${game}`} className="history-more">
        历史记录 <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
