export const HORIZONS = [7, 30, 90] as const;
export type Horizon = (typeof HORIZONS)[number];

/** Keyed by `${dayIndex}:${horizon}` so JSON serialization stays simple. */
export type ForwardResult = {
  cap: Record<string, number | null>;
  btc: Record<string, number | null>;
};

/**
 * Forward returns for each day, computed from series strictly AFTER that day.
 * Returns null when the horizon exceeds available history.
 */
export function attachForwardReturns(
  days: string[],
  capByDay: Map<string, number>,
  btcByDay: Map<string, number>,
): ForwardResult {
  const cap: Record<string, number | null> = {};
  const btc: Record<string, number | null> = {};
  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    const capNow = capByDay.get(day);
    const btcNow = btcByDay.get(day);
    for (const h of HORIZONS) {
      const futureDay = days[i + h];
      const capFuture = futureDay ? capByDay.get(futureDay) : undefined;
      const btcFuture = futureDay ? btcByDay.get(futureDay) : undefined;
      cap[`${i}:${h}`] = capNow && capFuture ? capFuture / capNow - 1 : null;
      btc[`${i}:${h}`] = btcNow && btcFuture ? btcFuture / btcNow - 1 : null;
    }
  }
  return { cap, btc };
}

export function forwardAt(
  result: ForwardResult,
  index: number,
  horizon: Horizon,
  series: "cap" | "btc",
): number | null {
  return result[series][`${index}:${horizon}`] ?? null;
}
