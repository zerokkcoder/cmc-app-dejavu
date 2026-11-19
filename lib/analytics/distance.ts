import { AXIS_COUNT, type FingerprintResult } from "./fingerprint";

export type Neighbour = {
  index: number;
  day: string;
  distance: number;
  similarity: number;
};

export function euclidean(
  matrix: Float64Array,
  a: number,
  b: number,
  dims = AXIS_COUNT,
): number {
  let sum = 0;
  for (let d = 0; d < dims; d += 1) {
    const diff = matrix[a * dims + d] - matrix[b * dims + d];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Top-K nearest days. Excludes the query itself and a +/- window around it,
 * otherwise today's nearest neighbour is trivially yesterday.
 */
export function topK(
  fp: FingerprintResult,
  queryIndex: number,
  k = 8,
  excludeWindow = 5,
): Neighbour[] {
  const candidates: Neighbour[] = [];
  for (let i = 0; i < fp.days.length; i += 1) {
    if (!fp.valid[i]) continue;
    if (Math.abs(i - queryIndex) <= excludeWindow) continue;
    const distance = euclidean(fp.matrix, queryIndex, i);
    candidates.push({
      index: i,
      day: fp.days[i],
      distance,
      // Similarity is a display convenience, not a probability.
      similarity: 1 / (1 + distance),
    });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.slice(0, k);
}
