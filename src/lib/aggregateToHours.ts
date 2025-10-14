// Convert 96 quarter-hour points to 24 hourly averages.
// If the array isn't 96 long, we still group in batches of 4.
export type QuarterPoint = { ts: number; ct_per_kwh: number };
export type HourPoint = { ts: number; ct_per_kwh: number };

export function aggregateToHours(quarters: QuarterPoint[]): HourPoint[] {
  if (!quarters?.length) return [];
  const out: HourPoint[] = [];
  for (let i = 0; i < quarters.length; i += 4) {
    const slice = quarters.slice(i, i + 4);
    const avg = slice.reduce((a, b) => a + b.ct_per_kwh, 0) / slice.length;
    out.push({ ts: slice[0].ts, ct_per_kwh: avg });
  }
  return out;
}
