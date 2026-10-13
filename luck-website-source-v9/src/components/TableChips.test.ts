import { describe, expect, it } from "vitest";
import { visibleTableChips, type TableChipGroup } from "./TableChips";

const eight: TableChipGroup = {
  id: "first",
  value: 1,
  count: 8,
  pending: true,
};
describe("physical table chip counts", () => {
  it("renders eight individual unit chips, then retains them when another placement is added", () => {
    const first = visibleTableChips([eight]);
    expect(first.chips).toHaveLength(8);
    expect(first.chips.every((c) => c.value === 1)).toBe(true);
    const next = visibleTableChips([eight, { ...eight, id: "second" }]);
    expect(next.total).toBe(16);
    expect(next.chips).toHaveLength(16);
    expect(next.chips.slice(0, 8)).toEqual(first.chips);
  });
  it("keeps denomination values and confirmed placements alongside pending ones", () => {
    const pile = visibleTableChips([
      { ...eight, pending: false },
      { id: "five", value: 5, count: 1, pending: true },
    ]);
    expect(pile.chips.filter((c) => !c.pending)).toHaveLength(8);
    expect(pile.chips.at(-1)?.value).toBe(5);
    expect(pile.total).toBe(9);
  });
  it("bounds huge piles without losing their actual count or newest chips", () => {
    const pile = visibleTableChips([
      { ...eight, count: 1_000_000 },
      { ...eight, id: "new", count: 2 },
    ]);
    expect(pile.total).toBe(1_000_002);
    expect(pile.chips).toHaveLength(36);
    expect(new Set(pile.chips.map((c) => c.key)).size).toBe(36);
    expect(pile.chips.filter((c) => c.groupId === "new")).toHaveLength(2);
  });
});
