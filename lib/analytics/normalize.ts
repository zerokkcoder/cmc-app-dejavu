/**
 * Normalization for the DÉJÀVU fingerprint.
 *
 * Bounded indicators (0..100, 0..1) use fixed scaling. Trending indicators use
 * an EXPANDING z-score: mean/std computed only from data up to and including t.
 * Using full-window statistics would leak future information into the past.
 */
export const WARMUP_DAYS = 180;

export function expandingZScore(values: number[], warmup = WARMUP_DAYS): number[] {
  const out = new Array<number>(values.length).fill(0);
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      out[i] = 0;
      continue;
    }
    sum += v;
    sumSq += v * v;
    const n = i + 1;
    const mean = sum / n;
    const variance = Math.max(0, sumSq / n - mean * mean);
    const sd = Math.sqrt(variance);
    out[i] = i < warmup || sd < 1e-12 ? 0 : (v - mean) / sd;
  }
  return out;
}

/** Map a bounded value into [-1, 1]. */
export function boundedScale(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 2 - 1;
}

/** Clamp helper used to keep radar geometry sane. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
