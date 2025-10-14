import type { HourPoint } from "./aggregateToHours";

// Find cheapest contiguous window of `durationHours` that ends before `latestFinish` (HH:mm, Berlin local).
export function cheapestWindow(
  hours: HourPoint[],
  durationHours: number,
  latestFinishHHmm = "23:59"
) {
  if (!hours.length || durationHours <= 0) return null;

  // Compute latest finish in minutes from midnight.
  const [H, M] = latestFinishHHmm.split(":").map(Number);
  const latestFinishMin = H * 60 + M;

  // Build local minute-of-day for each hour boundary
  const local = hours.map(h => {
    const d = new Date(h.ts);
    return { ...h, hour: d.getHours(), minute: d.getMinutes() }; // minute should be 0 on hourly data
  });

  let bestCost = Number.POSITIVE_INFINITY;
  let bestIdx = -1;

  for (let i = 0; i + durationHours <= local.length; i++) {
    const end = local[i + durationHours - 1];
    const endMin = end.hour * 60 + end.minute + 60; // end of that last hour block
    if (endMin > latestFinishMin) continue;

    let cost = 0;
    for (let k = 0; k < durationHours; k++) cost += local[i + k].ct_per_kwh;

    if (cost < bestCost) {
      bestCost = cost;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) return null;

  const start = local[bestIdx];
  const end = local[bestIdx + durationHours - 1];
  return {
    startTs: hours[bestIdx].ts,
    endTs: hours[bestIdx + durationHours - 1].ts + 60 * 60 * 1000,
    avg_ct_per_kwh: bestCost / durationHours,
    startHour: start.hour,
    endHour: end.hour + 1,
  };
}
