import { boundedScale, expandingZScore, WARMUP_DAYS } from "./normalize";

export const AXIS_LABELS_ZH = [
  "恐慌贪婪",
  "BTC 主导率",
  "山寨轮动代理",
  "市值动能 30d",
  "BTC 成交量动能 30d",
  "市场广度 30d",
] as const;

export const AXIS_LABELS_EN = [
  "Fear & Greed",
  "BTC Dominance",
  "Alt Rotation (proxy)",
  "Cap Momentum 30d",
  "BTC Volume Momentum 30d",
  "Breadth 30d",
] as const;

export const AXIS_COUNT = 6;
export const LOOKBACK = 30;

export type GlobalDay = {
  cap: number;
  volume?: number;
  altcap?: number;
  btcDominance?: number;
};

export type FingerprintInput = {
  days: string[];
  fearGreed: Map<string, number>;
  global: Map<string, GlobalDay>;
  /** BTC volume_24h from /v3/cryptocurrency/quotes/historical. */
  volume: Map<string, number>;
  breadth: Map<string, number>;
};

export type FingerprintResult = {
  days: string[];
  /** Flat Float64Array, row-major, 6 values per day. */
  matrix: Float64Array;
  /** False for warm-up days; those days are never used as neighbours. */
  valid: boolean[];
  rawAxes: number[][];
};

function pctChange(now: number, before: number): number {
  return before > 0 ? now / before - 1 : 0;
}

/**
 * Build a 6-dimensional market-state vector for every UTC day.
 * Every input at index i is strictly dated <= days[i]; no look-ahead.
 */
export function buildFingerprint(input: FingerprintInput): FingerprintResult {
  const days = input.days.filter((d) => {
    const g = input.global.get(d);
    return (
      input.fearGreed.has(d) &&
      input.breadth.has(d) &&
      input.volume.has(d) &&
      g !== undefined &&
      Number.isFinite(g.cap)
    );
  });

  const rawAxes: number[][] = [[], [], [], [], [], []];
  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    const g = input.global.get(day)!;
    const prev = i >= LOOKBACK ? input.global.get(days[i - LOOKBACK]) : undefined;
    const altRatio = g.altcap && g.cap > 0 ? g.altcap / g.cap : 0;
    const prevAltRatio =
      prev?.altcap && prev.cap > 0 ? prev.altcap / prev.cap : altRatio;

    rawAxes[0].push(input.fearGreed.get(day)!);
    rawAxes[1].push(g.btcDominance ?? 0);
    rawAxes[2].push(altRatio > 0 && prevAltRatio > 0 ? altRatio / prevAltRatio - 1 : 0);
    rawAxes[3].push(prev ? pctChange(g.cap, prev.cap) : 0);
    const volNow = input.volume.get(day) ?? 0;
    const volPrev = input.volume.get(days[i - LOOKBACK]) ?? 0;
    rawAxes[4].push(volNow > 0 && volPrev > 0 ? Math.log(volNow) - Math.log(volPrev) : 0);
    rawAxes[5].push(input.breadth.get(day)!);
  }

  const z1 = expandingZScore(rawAxes[1]);
  const z2 = expandingZScore(rawAxes[2]);
  const z3 = expandingZScore(rawAxes[3]);
  const z4 = expandingZScore(rawAxes[4]);

  const matrix = new Float64Array(days.length * AXIS_COUNT);
  const valid: boolean[] = [];

  for (let i = 0; i < days.length; i += 1) {
    const values = [
      boundedScale(rawAxes[0][i], 0, 100),
      z1[i],
      z2[i],
      z3[i],
      z4[i],
      boundedScale(rawAxes[5][i], 0, 1),
    ];
    for (let a = 0; a < AXIS_COUNT; a += 1) matrix[i * AXIS_COUNT + a] = values[a];
    valid.push(i >= WARMUP_DAYS);
  }

  return { days, matrix, valid, rawAxes };
}
