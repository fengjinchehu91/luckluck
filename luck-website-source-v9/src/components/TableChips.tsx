import type { CSSProperties } from "react";

export interface TableChipGroup {
  id: string;
  value: number;
  count: number;
  pending: boolean;
}

// Keep small bets literal; large piles retain their first and newest chips.
export function visibleTableChips(groups: TableChipGroup[]) {
  const total = groups.reduce((sum, g) => sum + g.count, 0);
  const chips: {
    key: string;
    value: number;
    pending: boolean;
    groupId: string;
  }[] = [];
  let offset = 0;
  for (const group of groups) {
    const ranges =
      total <= 36
        ? [[0, group.count]]
        : [
            [0, Math.max(0, Math.min(group.count, 18 - offset))],
            [Math.max(0, total - 18 - offset), group.count],
          ];
    for (const [start, end] of ranges) {
      for (let i = start; i < end; i++) {
        chips.push({
          key: `${group.id}-${i}`,
          value: group.value,
          pending: group.pending,
          groupId: group.id,
        });
      }
    }
    offset += group.count;
  }
  return { total, chips };
}

export function TableChips({
  groups,
  latestId,
}: {
  groups: TableChipGroup[];
  latestId?: string;
}) {
  const { total, chips } = visibleTableChips(groups);
  if (!total) return null;
  const columns = Math.min(3, chips.length);
  return (
    <span className="table-chip-pile" data-chip-count={total}>
      {chips.map((chip, index) => (
        <span
          className={`table-chip-sprite ${chip.pending ? "is-pending" : "is-confirmed"} ${chip.groupId === latestId ? "is-landing" : ""}`}
          key={chip.key}
          style={
            {
              "--chip-column": (index % columns) - (columns - 1) / 2,
              "--chip-level": Math.floor(index / columns),
              zIndex: index + 1,
            } as CSSProperties
          }
        >
          <img
            src={`/assets/table-chip-${chip.value}.webp`}
            alt=""
            width="256"
            height="192"
          />
        </span>
      ))}
      {total > chips.length && (
        <span className="chip-pile-total">共 {total.toLocaleString()} 枚</span>
      )}
    </span>
  );
}
