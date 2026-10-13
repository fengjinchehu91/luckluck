import { useApp } from "../hooks";
import { Money } from "./ui";
export function TierTable({ detailed = false }: { detailed?: boolean }) {
  const { tiers, daily } = useApp();
  return (
    <div className={`tier-table ${detailed ? "detailed" : ""}`}>
      <div className="tier-table-head">
        <span>奖级 / 分配比例</span>
        <span>当前奖池余额</span>
        {detailed && (
          <>
            <span>预计可释放</span>
            <span>中奖权重</span>
          </>
        )}
      </div>
      {tiers.map((t) => {
        const rule = daily.rules.tiers.find((r) => r.size === t.size)!;
        return (
          <div className="tier-table-row" key={t.size}>
            <div>
              <strong>
                <i>{t.size}</i>选 {t.size} 中 {t.size}
              </strong>
              <small>新入库资金的 {rule.shareBps / 100}%</small>
            </div>
            <div>
              <Money value={t.usdt} unit="USDT" />
              <Money value={t.luck} digits={0} />
            </div>
            {detailed && (
              <>
                <div>
                  <Money
                    value={
                      (BigInt(t.usdt) * BigInt(daily.rules.releaseBps)) / 10000n
                    }
                    unit="USDT"
                  />
                  <Money
                    value={
                      (BigInt(t.luck) * BigInt(daily.rules.releaseBps)) / 10000n
                    }
                    digits={0}
                  />
                </div>
                <span>{daily.stage === "SETTLED" ? t.weight : "待开奖"}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
