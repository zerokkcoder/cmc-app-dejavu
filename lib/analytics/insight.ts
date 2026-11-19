import { AXIS_LABELS_EN, AXIS_LABELS_ZH, type FingerprintResult } from "./fingerprint";
import { forwardAt, type ForwardResult } from "./forwardReturns";

export type GeneratedInsight = {
  zh: string;
  en: string;
  axis: number;
  direction: "low" | "high";
  sampleSize: number;
  median: number;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Value at quantile position of an index array already sorted by that axis. */
function quantileValue(sortedIndices: number[], values: number[], q: number): number {
  const position = Math.min(sortedIndices.length - 1, Math.max(0, Math.floor(sortedIndices.length * q)));
  return values[sortedIndices[position]];
}

const FORMATTER = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

/**
 * Find the strongest conditional pattern: bottom/top quintile on one axis vs
 * median forward 30-day total-market-cap return. Purely descriptive statistics.
 */
export function generateInsight(
  fp: FingerprintResult,
  forward: ForwardResult,
  horizon: 7 | 30 | 90 = 30,
): GeneratedInsight | null {
  const indices = fp.days.map((_, i) => i).filter((i) => fp.valid[i]);
  if (indices.length < 100) return null;

  let best: GeneratedInsight | null = null;

  for (let axis = 0; axis < 6; axis += 1) {
    const sorted = [...indices].sort((a, b) => fp.rawAxes[axis][a] - fp.rawAxes[axis][b]);
    const lo = quantileValue(sorted, fp.rawAxes[axis], 0.2);
    const hi = quantileValue(sorted, fp.rawAxes[axis], 0.8);

    for (const direction of ["low", "high"] as const) {
      const group = sorted.filter((i) => {
        const v = fp.rawAxes[axis][i];
        return direction === "low" ? v <= lo : v >= hi;
      });
      const outcomes = group
        .map((i) => forwardAt(forward, i, horizon, "cap"))
        .filter((v): v is number => v !== null && Number.isFinite(v));
      if (outcomes.length < 20) continue;

      const m = median(outcomes);
      if (!best || Math.abs(m) > Math.abs(best.median)) {
        const labelZh = AXIS_LABELS_ZH[axis];
        const labelEn = AXIS_LABELS_EN[axis];
        const dirZh = direction === "low" ? "处于历史低位" : "处于历史高位";
        const dirEn = direction === "low" ? "in its lowest quintile" : "in its highest quintile";
        best = {
          zh: `历史上当「${labelZh}」${dirZh}时，随后 ${horizon} 天全市场市值中位数为 ${FORMATTER(m)}（n=${outcomes.length}）。`,
          en: `Historically, when ${labelEn} was ${dirEn}, the median ${horizon}-day total market cap change was ${FORMATTER(m)} (n=${outcomes.length}).`,
          axis,
          direction,
          sampleSize: outcomes.length,
          median: m,
        };
      }
    }
  }
  return best;
}
