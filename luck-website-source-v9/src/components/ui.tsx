import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  Clover,
  Copy,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { config, stageLabels, TOKEN_LOGO } from "../config";
import { useApp, useNow, remaining } from "../hooks";
import { decimal } from "../lib/math";
import type { Round, Stage } from "../types";
export const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function Brand({ small = false }: { small?: boolean }) {
  const { rules } = useApp();
  return (
    <Link
      to="/"
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label="luck 首页"
    >
      <img
        src={
          rules.logoPath === "/assets/luck-mark.svg"
            ? TOKEN_LOGO
            : rules.logoPath
        }
        alt=""
        onError={(e) => {
          e.currentTarget.src = TOKEN_LOGO;
        }}
      />
      <span>
        luck<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function Money({
  value,
  unit = "luck",
  digits = 2,
  className = "",
}: {
  value: string | bigint;
  unit?: "luck" | "USDT";
  digits?: number;
  className?: string;
}) {
  return (
    <span className={`money ${className}`}>
      {decimal(value, unit === "USDT" ? 6 : config.token.decimals, digits)}
      <small>{unit}</small>
    </span>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Status({ stage }: { stage: Stage }) {
  return (
    <span className={`status ${stage === "OPEN" ? "open" : ""}`}>
      <i />
      {stageLabels[stage]}
    </span>
  );
}
export function Countdown({
  round,
  compact = false,
}: {
  round: Round;
  compact?: boolean;
}) {
  const now = useNow(),
    t = remaining(round, now);
  return (
    <span
      className={`countdown ${compact ? "compact" : ""}`}
      aria-label={`剩余 ${t.hours} 小时 ${t.minutes} 分 ${t.seconds} 秒`}
    >
      <span>{t.hours}</span>
      <b>:</b>
      <span>{t.minutes}</span>
      <b>:</b>
      <span>{t.seconds}</span>
    </span>
  );
}
export function Ball({
  n,
  small = false,
  gold = false,
}: {
  n: number;
  small?: boolean;
  gold?: boolean;
}) {
  return (
    <span
      className={`ball ${small ? "ball-small" : ""} ${gold ? "ball-gold" : ""}`}
    >
      <span>{String(n).padStart(2, "0")}</span>
    </span>
  );
}
const pips: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};
export function Die({
  n,
  decorative = false,
}: {
  n: number;
  decorative?: boolean;
}) {
  return (
    <span
      className={`die ${decorative ? "die-art" : ""}`}
      role="img"
      aria-label={`${n} 点骰子`}
    >
      <span className="die-face">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} className={pips[n]?.includes(i + 1) ? "pip" : ""} />
        ))}
      </span>
    </span>
  );
}
export function Dice({
  values = [3, 5, 6],
  art = false,
}: {
  values?: number[];
  art?: boolean;
}) {
  return (
    <div className={`dice ${art ? "dice-art" : ""}`}>
      {values.map((n, i) => (
        <Die key={i} n={n} decorative={art} />
      ))}
    </div>
  );
}
export function CoinArt({ small = false }: { small?: boolean }) {
  return (
    <div className={`coin-art ${small ? "coin-small" : ""}`} aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="floating-chip chip-one" />
      <div className="floating-chip chip-two" />
      <div className="gold-coin">
        <div className="coin-inside">
          <Clover strokeWidth={1.2} />
          <span>luck</span>
          <small>MAKE YOUR OWN LUCK</small>
        </div>
      </div>
      <span className="spark spark-one" />
      <span className="spark spark-two" />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    const previous = document.activeElement;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    d.addEventListener("keydown", handler);
    return () => {
      d.close();
      d.removeEventListener("keydown", handler);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="关闭弹窗" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title = "还没有参与记录",
  text = "从一次选择开始，看看幸运会落在哪里。",
  action = true,
}: {
  title?: string;
  text?: string;
  action?: boolean;
}) {
  return (
    <div className="empty">
      <Clover size={38} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <Link to="/daily" className="button secondary">
          去每日挑战 <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Multiplier({
  value,
  set,
}: {
  value: number;
  set: (n: number) => void;
}) {
  return (
    <div className="multiplier">
      <label htmlFor="multiplier">参与倍数</label>
      <div className="multiplier-controls">
        {[1, 5, 10, 50].map((n) => (
          <button
            key={n}
            className={value === n ? "selected" : ""}
            onClick={() => set(n)}
          >
            {n}×
          </button>
        ))}
        <div className="number-input">
          <input
            id="multiplier"
            aria-label="自定义倍数"
            type="number"
            min="1"
            max="1000000"
            step="1"
            value={Number.isNaN(value) ? "" : value}
            onChange={(e) => set(e.target.valueAsNumber)}
          />
          <span>倍</span>
        </div>
      </div>
    </div>
  );
}
export function PageHead({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function RoundStrip({ round }: { round: Round }) {
  return (
    <div className="round-strip">
      <span>
        本期 <strong>#{round.id}</strong>
      </span>
      <Status stage={round.stage} />
      <span className="round-deadline">
        <Clock3 size={14} />{" "}
        {new Date(round.closesAt).toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        截止
      </span>
      <Countdown round={round} compact />
    </div>
  );
}
export function Spinner() {
  return <Loader2 size={17} className="spinner" />;
}
export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false),
    toast = useToast();
  return (
    <button
      className="icon-button"
      aria-label="复制地址"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          toast("复制失败，请手动选择地址复制");
        }
      }}
    >
      {done ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}
export function ClaimStatus({ status }: { status: string }) {
  const names: Record<string, string> = {
    PENDING: "待开奖",
    CLAIMABLE: "待领奖",
    CLAIMED: "已领取",
    LOST: "未中奖",
    NEEDS_REVIEW: "待处理",
  };
  return (
    <Badge tone={status === "CLAIMABLE" ? "gold" : ""}>
      {status === "CLAIMED" && <CheckCheck size={12} />}{" "}
      {names[status] || status}
    </Badge>
  );
}
export function AddressLink({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  return (
    <div className="key-row">
      <span>{label}</span>
      {address ? (
        <a
          href={`${config.network.explorer}/address/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          {address.slice(0, 6)}…{address.slice(-4)} <ExternalLink size={12} />
        </a>
      ) : (
        <span className="muted">待接入</span>
      )}
    </div>
  );
}
