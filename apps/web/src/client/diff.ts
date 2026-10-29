export type DiffSegment = { text: string; changed: boolean };
function tokens(value: string): string[] { return value.match(/\s+|\S+/g) ?? []; }
function merge(parts: DiffSegment[]): DiffSegment[] {
  const merged: DiffSegment[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last && last.changed === part.changed) last.text += part.text;
    else merged.push({ ...part });
  }
  return merged;
}
/** Word-level diff. `from` marks words missing in `to`; `to` marks words missing in `from`. Joining a side's segments always gives that text back unchanged. */
export function diffWords(from: string, to: string): { from: DiffSegment[]; to: DiffSegment[]; changes: number } {
  const a = tokens(from), b = tokens(to);
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  }
  const left: DiffSegment[] = [], right: DiffSegment[] = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { left.push({ text: a[i], changed: false }); right.push({ text: b[j], changed: false }); i++; j++; }
    else if (table[i + 1][j] >= table[i][j + 1]) left.push({ text: a[i++], changed: true });
    else right.push({ text: b[j++], changed: true });
  }
  while (i < a.length) left.push({ text: a[i++], changed: true });
  while (j < b.length) right.push({ text: b[j++], changed: true });
  // Whitespace between two changed words belongs to the change, not to the unchanged text.
  const settle = (parts: DiffSegment[]) => parts.map((part, index) => part.changed || !/^\s+$/.test(part.text) ? part
    : { ...part, changed: Boolean(parts[index - 1]?.changed && parts[index + 1]?.changed) });
  const l = merge(settle(left)), r = merge(settle(right));
  return { from: l, to: r, changes: Math.max(l.filter(part => part.changed).length, r.filter(part => part.changed).length) };
}
